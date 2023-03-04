import { Problem, State, TreeCache, TreeNode } from "./types";
import { Queue } from "./classes/Queue";
import * as fs from 'fs';
import { parser } from 'stream-json';
import { pick } from 'stream-json/filters/Pick';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { sha1 } from 'object-hash';
import path = require("path");

/**
 * A function to split the component into useful parts.
 * @param s the component string
 * @returns an array containing split component parts [agent_name, clazz, node]
 */
function splitComponents(s: string) {
    const regexName = /\w.*(?=::)/;
    const regexClazz = /[^\.]*(?=\/)/;
    const regexNode = /[^\/]*$/;

    let regName = regexName.exec(s);
    let compName = "";
    if (regName) {
        compName = regName[0];
    }
    let regClazz = regexClazz.exec(s);
    let compClazz = "";
    if (regClazz) {
        compClazz = regClazz[0];
    }
    let regNode = regexNode.exec(s);
    let compNode = "";
    if (regNode) {
        compNode = regNode[0];
    }

    return [compName, compClazz, compNode];
}

/**
 * A function to find the index of the trace a given event belongs to.
 * @param cache an dictionary that maps the eventID to index in the traces list
 * @param eventRow an event at a particular row in trace.json
 * @returns the index of the trace the event belongs to; otherwise undefined
 */
function findTrace(cache: { [id: string]: number; }, eventRow: { [x: string]: any; }) {
    if ("threadID" in eventRow) {
        let id: string = eventRow["threadID"];
        if (id in cache) {
            return cache[id];
        }
    }
    if ("stimulus" in eventRow) {
        let id: string = eventRow["stimulus"]["messageID"];
        if (id in cache) {
            return cache[id];
        }
    }
    return undefined;
}

/**
 * A function to cache the index of the trace that a given event belongs to.
 * @param cache an dictionary that maps the eventID to index in the traces list
 * @param eventRow an event at a particular row in trace.json
 * @param traceID the index of the trace that the event belongs to
 */
function addToCache(cache: { [id: string]: number; }, eventRow: { [x: string]: any; }, traceID: number) {
    if ("threadID" in eventRow) {
        let id: string = eventRow["threadID"];
        cache[id] = traceID;
    }
    if ("stimulus" in eventRow) {
        let id: string = eventRow["stimulus"]["messageID"];
        cache[id] = traceID;
    }
    if ("response" in eventRow) {
        let id: string = eventRow["response"]["messageID"];
        cache[id] = traceID;
    }
}

/**
 * A function to pretty print a message.
 * @param msg either a stimulus or response message from a given event
 * @returns a string that is pretty formatted
 */
function prettyMessage(msg: { [header: string]: string; }) {
    let clazz = msg["clazz"];
    let p = clazz.lastIndexOf(".");
    if (p !== -1) {
        //get the last clazz after the last '.'
        clazz = clazz.substring(p + 1);
    }
    let sender = "";
    if ("sender" in msg) {
        sender = msg["sender"];
    }
    let recipient = "";
    if ("recipient" in msg) {
        recipient = msg["recipient"];
    }
    return `${clazz} [[${sender} -> ${recipient}]]`;
}


/**
 * Public function to analyse a group of events from a session and groups them into different traces.
 * @param events group of events from a session
 * @returns list of tuples of size equal to number of traces e.g. [(time, desc, traceOfEvents), ...]
 */
export function analyse(events: Array<{ [header: string]: any }>) {
    let traces: Array<[number, string, Array<{ [header: string]: any }>]> = [];
    let cache: { [id: string]: number; } = {};
    for (let i = 0; i < events.length; i++) {
        let eventRow = events[i];
        let traceID = findTrace(cache, eventRow);
        if (traceID === undefined) {
            let compArray = splitComponents(eventRow["component"]);
            let cname = compArray[0];
            let cnode = compArray[2];
            if (cnode !== "") {
                cnode = `[${cnode}]`;
            }
            let desc = cnode + " " + cname;
            if ("stimulus" in eventRow) {
                desc = cnode + " " + prettyMessage(eventRow["stimulus"]);
            } else if ("response" in eventRow) {
                desc = cnode + " " + prettyMessage(eventRow["response"]);
            }
            traces.push([eventRow["time"], desc, [eventRow]]);
            traceID = traces.length - 1;
        } else {
            traces[traceID][2].push(eventRow);
        }
        addToCache(cache, eventRow, traceID);
    }
    return traces;
}

/**
 * A function that decides whether to capture a given message or to ignore it. Also stores the filtered actors and messages in the arrays provided in arguments.
 * @param actors an array of actors (agents)
 * @param msgs an array to store the sequenced messages
 * @param origin dictionary of nodes seen before
 * @param node node of current event (component node)
 * @param agent agent of current event (component name)
 * @param time the current time
 * @param msg event["stimulus"] or event["response"]
 * @param stimulus indicate if stimulus or not
 * @returns void
 */
function capture(actors: Array<[string, string]>, msgs: Array<[number, string, string, string]>, origin: { [trf: string]: string; }, node: string, agent: string, time: number, msg: { [header: string]: string; }, stimulus: boolean) {
    if (!("recipient" in msg)) {
        return;
    }
    let recipient = msg["recipient"];
    if (recipient.startsWith('#')) {
        if (!stimulus) { return; }
        recipient = agent;
    }
    let originNode = node;
    let originKey = msg["messageID"] + "->" + recipient;
    if (originKey in origin) {
        let n = origin[originKey];
        if (originNode === n) { return; }
        originNode = n;
    }
    if (stimulus && !("sender" in msg)) { return; }
    let sender = agent;
    if ("sender" in msg) {
        sender = msg["sender"];
    }
    if (node !== "") {
        sender = sender + "/" + originNode;
        recipient = recipient + "/" + node;
    }
    let clazz = msg["clazz"];
    if (clazz === "org.arl.fjage.Message") {
        clazz = msg["performative"];
    } else {
        let p = clazz.lastIndexOf('.');
        if (p !== -1) {
            //get the last clazz after the last '.'
            clazz = clazz.substring(p + 1);
        }
    }
    origin[originKey] = node;
    if (sender === recipient) { return; }

    actors.push([originNode, sender]);
    actors.push([node, recipient]);
    msgs.push([time, clazz, sender, recipient]);
}

/**
 * A public function that sequences the events in a given trace.
 * @param events the Array of events for a given trace
 * @returns a triple containing: (i) a list of unique sorted actors, (ii) a list of sequenced messages, (iii) the root node from the tree of events
 */
export function sequence(events: Array<{ [header: string]: any }>): [Array<[string, string]>, Array<[number, string, string, string]>, TreeNode] {
    let actors: Array<[string, string]> = [];
    let msgs: Array<[number, string, string, string]> = [];
    let origin: { [trf: string]: string; } = {};
    let treeCache: TreeCache = {};
    for (let i = 0; i < events.length; i++) {
        let compArray = splitComponents(events[i]["component"]);
        let cname = compArray[0];
        let cnode = compArray[2];

        if ("stimulus" in events[i]) {
            capture(actors, msgs, origin, cnode, cname, events[i]["time"], events[i]["stimulus"], true);
        }
        if ("response" in events[i]) {
            capture(actors, msgs, origin, cnode, cname, events[i]["time"], events[i]["response"], false);
        }
        updateTree(events[i]["stimulus"], events[i]["response"], treeCache, events[i]["time"], cnode, cname);
    }

    actors.sort(sortFunction);
    // getting the unique actors
    let d: { [x: string]: any } = {};
    let out = [];
    for (let i = 0; i < actors.length; i++) {
        let item = actors[i];
        let rep = item.toString();

        if (!d[rep]) {
            d[rep] = true;
            out.push(item);
        }
    }
    //return head from treeCache
    return [out, msgs, treeCache["head"]];
}

function sortFunction(a: [string, string], b: [string, string]) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}

/**
 * A public function that writes the mermaid instructions to a string.
 * @param actors a list of unique actors (agents)
 * @param msgs a list of sequenced messages
 */
export function mermaid(actors: Array<[string, string]>, msgs: Array<[number, string, string, string]>) {
    let output = "";
    output += "sequenceDiagram\n";
    for (let i = 0; i < actors.length; i++) {
        let a = actors[i];
        let id = a[1].replace('/', '_');
        output += `  participant ${id} as ${a[1]}\n`;
    }
    for (let j = 0; j < msgs.length; j++) {
        let msg = msgs[j];
        let id1 = msg[2].replace('/', '_');
        let id2 = msg[3].replace('/', '_');
        output += `  ${id1}`;
        if (msg[1] === "AGREE") { output += '-'; }
        output += `->>${id2}: ${(msg[1])}\n`;
    }
    return output;
}

/**
 * Function to find a node in tree.
 * @param cache the cache that is storing the tree
 * @param msgID the key used to retrieve the node; the stimulus.messageID
 * @returns the node if present, otherwise undefined
 */
function findNode(cache: TreeCache, msgID: string) {
    if (msgID in cache) {
        return cache[msgID];
    }
    return undefined;
}

/**
 * Function that returns a doubly linked tree from trace.json.
 * @param stimulus the stimulus message
 * @param response the response message
 * @param cache the cache storing the tree
 * @param time time that messages occured
 * @param node node in this case refers to name of underwater node
 * @param agent agent of current event (component name)
 */
function updateTree(stimulus: { [header: string]: any; }, response: { [header: string]: any; }, cache: TreeCache, time: number, node: string, agent: string) {
    //get the stimulus from cache
    let stim = findNode(cache, stimulus["messageID"]);

    //otherwise build a new stimulus TreeNode object
    if (stim === undefined) {
        //create the stimulus object
        let stimClazz = stimulus["clazz"];
        let p = stimClazz.lastIndexOf('.');
        if (p !== -1) {
            //get the last clazz after the last '.'
            stimClazz = stimClazz.substring(p + 1);
        }
        stim = {
            id: stimulus["messageID"],
            parent: {},
            children: {},
            time: time,
            clazz: stimClazz,
            sender: stimulus["sender"] + `/${node}`,
            recipient: stimulus["recipient"] + `/${node}`
        };

        if (!("head" in cache)) {
            //update the head of TreeCache
            cache["head"] = stim;
        }
    }

    if (stim.sender === stim.recipient) {
        //try to replece recipient with new node for HalfDuplexModem cases
        stim.recipient = stim.recipient.split('/')[0] + `/${node}`;
    }

    if (stim.recipient.startsWith('#')) {
        //replce recipients starting with '#'. E.g. recipient: "#phy__ntf"
        stim.recipient = agent + `/${node}`;
    }

    let clazz = response["clazz"];
    if (clazz === "org.arl.fjage.Message") {
        clazz = response["performative"];
    } else {
        let p = clazz.lastIndexOf('.');
        if (p !== -1) {
            //get the last clazz after the last '.'
            clazz = clazz.substring(p + 1);
        }
    }
    let respSender = agent;
    if ("sender" in response) {
        respSender = response.sender;
    }
    //build the response TreeNode object
    let resp: TreeNode = {
        id: response['messageID'],
        parent: {},
        children: {},
        time: time,
        clazz: clazz,
        sender: respSender + `/${node}`,
        recipient: response.recipient + `/${node}`
    };

    //update the stimulus TreeNode with child
    stim.children[response.messageID] = resp;
    //update the response TreeNode with parent
    resp.parent[stimulus.messageID] = stim;

    //add stim and resp TreeNode to cache
    cache[stimulus.messageID] = stim;
    cache[response.messageID] = resp;
}

/**
 * function that sorts the event tree into chronological order.
 * @param root root of the event tree
 * @returns a list with the event tree nodes in chronological order
 */
export function sortTreeByTime(root: TreeNode) {

    let current = root;
    let queue = new Queue<TreeNode>();
    let outList: TreeNode[] = [];
    queue.push(current);
    while (!queue.isEmpty()) {
        current = queue.pop();
        // add current node to list
        outList.push(current);

        // add any children of current node to queue
        for (let child in current.children) {
            queue.push(current.children[child]);
        }
    }

    // sort output list
    outList.sort(function (a, b) {
        return a.time - b.time;
    });

    return outList;

}

/**
 * function to create html content that is loaded in a webview.
 * @param events an array of chronological events returned from sortTreeByTime()
 * @returns html content as a string
 */
export function createHTMLContent(events: Array<TreeNode>) {
    let htmlContent = `<!DOCTYPE html>
	<html>
	<head>
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
	* {
	  box-sizing: border-box;
	}
	
	body {
	  background-color: #474e5d;
	  font-family: Helvetica, sans-serif;
	}
	
	/* The actual timeline (the vertical ruler) */
	.timeline {
	  position: relative;
	  max-width: 1200px;
	  margin: 0 auto;
	}
	
	/* The actual timeline (the vertical ruler) */
	.timeline::after {
	  content: '';
	  position: absolute;
	  width: 6px;
	  background-color: white;
	  top: 0;
	  bottom: 0;
	  left: 50%;
	  margin-left: -3px;
	}
	
	/* Container around content */
	.container {
	  padding: 10px 40px;
	  position: relative;
	  background-color: inherit;
	  width: 50%;
	}
	
	/* The circles on the timeline */
	.container::after {
	  content: '';
	  position: absolute;
	  width: 25px;
	  height: 25px;
	  right: -17px;
	  background-color: white;
	  border: 4px solid #FF9F55;
	  top: 15px;
	  border-radius: 50%;
	  z-index: 1;
	}
	
	/* Place the container to the left */
	.left {
	  left: 0;
	}
	
	/* Place the container to the right */
	.right {
	  left: 50%;
	}
	
	/* Add arrows to the left container (pointing right) */
	.left::before {
	  content: " ";
	  height: 0;
	  position: absolute;
	  top: 22px;
	  width: 0;
	  z-index: 1;
	  right: 30px;
	  border: medium solid white;
	  border-width: 10px 0 10px 10px;
	  border-color: transparent transparent transparent white;
	}
	
	/* Add arrows to the right container (pointing left) */
	.right::before {
	  content: " ";
	  height: 0;
	  position: absolute;
	  top: 22px;
	  width: 0;
	  z-index: 1;
	  left: 30px;
	  border: medium solid white;
	  border-width: 10px 10px 10px 0;
	  border-color: transparent white transparent transparent;
	}
	
	/* Fix the circle for containers on the right side */
	.right::after {
	  left: -16px;
	}
	
	/* The actual content */
	.content {
      color: #54595e;
	  padding: 20px 30px;
	  background-color: white;
	  position: relative;
	  border-radius: 6px;
	}
	
	/* Media queries - Responsive timeline on screens less than 600px wide */
	@media screen and (max-width: 600px) {
	  /* Place the timelime to the left */
	  .timeline::after {
	  left: 31px;
	  }
	  
	  /* Full-width containers */
	  .container {
	  width: 100%;
	  padding-left: 70px;
	  padding-right: 25px;
	  }
	  
	  /* Make sure that all arrows are pointing leftwards */
	  .container::before {
	  left: 60px;
	  border: medium solid white;
	  border-width: 10px 10px 10px 0;
	  border-color: transparent white transparent transparent;
	  }
	
	  /* Make sure all circles are at the same spot */
	  .left::after, .right::after {
	  left: 15px;
	  }
	  
	  /* Make all right containers behave like the left ones */
	  .right {
	  left: 0%;
	  }
	}
	</style>
	</head>
	<body>
	
	<div class="timeline">
	`;
    // container style - determines if text container appears on left or right of timeline
    let currentContainer = "container left";

    //create html content for each node in events (sorted by time)
    for (let node of events) {
        htmlContent += `<div class="${currentContainer}">
		<div id="${node.id}" class="content">
		  <h2>Time: ${node.time}</h2>
		  <p>
            id: ${node.id}<br><br>`;    //adding id to event container

        let parentID = Object.keys(node.parent); //each node aside from root should have 1 parent
        //adding parent to event container if exists
        if (parentID.length > 0) {
            htmlContent += `parent: <a href="#${parentID[0]}">${parentID[0]}</a><br><br>`;
        } else {
            htmlContent += `parent: No Parent<br><br>`;
        }

        let childrenIDs = Object.keys(node.children);   //getting the children IDs from a particular event
        //adding children to event container if it exists
        htmlContent += `children: `;
        if (childrenIDs.length > 0) {
            for (let child of childrenIDs) {
                htmlContent += `<a href="#${child}">${child}</a>,<br><br>`;
            }
        } else {
            htmlContent += `No Children<br><br>`;
        }

        //adding clazz to event container
        htmlContent += `clazz: ${node.clazz}<br><br>`;
        //adding sender node to event container
        htmlContent += `sender: ${node.sender}<br><br>`;
        //adding recipient node to event container
        htmlContent += `recipient: ${node.recipient}`;

        //closing html tags for container
        htmlContent += `
                </p>
            </div>
            </div>`;

        if (currentContainer === "container left") {
            currentContainer = "container right";
        } else {
            currentContainer = "container left";
        }
    }

    //closing main html tags
    htmlContent += `
    </div>
    </body>
    </html>
    `;

    return htmlContent;
}

export function createJsonStream(tracePath: string) {
    const pipeline = fs.createReadStream(tracePath).pipe(parser());
    let groupsOfEvents = pipeline.pipe(pick({ filter: 'events' }));
    let arrOfGroupsStream = groupsOfEvents.pipe(streamArray());
    return arrOfGroupsStream;
}

/**
 * function that extracts out tx events from a node, e.g. node A.
 * @param groupEvents group of events from trace.json file
 * @returns 2d array containing all tx events from a unet node, e.g., [[txID1, timing1], [txID2, timing2]]
 */
export function extractTxToDataframe(receiver: string, groupEvents: any) {
    let txDataframe: any[][] = [];
    groupEvents.forEach((event: any) => {
        //for each event; where event is {time, component, stimulus, response}
        if ("response" in event) {
            let response = event["response"];
            // TODO: include stimulus.sender in trace.json  && response.receiver === receiver
            if (response.clazz === "org.arl.unet.phy.TxFrameReq") {
                //extract out the ID and timing
                let txID = response.messageID;
                let time = event["time"];
                let pair = [txID, time]; //pair of ID and time
                txDataframe.push(pair);
            }
        }
    });
    return txDataframe;
}

/**
 * function that extracts out rx events from a node, e.g. node A.
 * @param groupEvents group of events from trace.json file
 * @returns 2d array containing all rx events from a unet node, e.g., [[rxID1, timing1], [rxID2, timing2]]
 */
export function extractRxToDataframe(sender: string, groupEvents: any) {
    let rxDataframe: any[][] = [];
    groupEvents.forEach((event: any) => {
        //for each event; where event is {time, component, stimulus, response}
        if ("stimulus" in event) {
            let stimulus = event["stimulus"];
            // TODO: include stimulus.sender in trace.json  && stimulus.sender === sender
            if (stimulus.clazz === "org.arl.unet.phy.RxFrameNtf") {
                //extract out the ID and timing
                let rxID = stimulus.messageID;
                let time = event["time"];
                let pair = [rxID, time]; //pair of ID and time
                rxDataframe.push(pair);
            }
        }
    });
    return rxDataframe;
}

export function extractNode(events: Array<{ [header: string]: any }>) {
    let components = splitComponents(events[0].component);
    let node = components[2];
    return node;
}

/**
 * function that removes duplicate entries in rx/tx dataframes
 * @param data a dataframe of rx or tx ids and timings i.e., output from extractToDataFrame functions.
 * @returns a dataframe with no duplicate IDs
 */
export function noDupes(dataFrame: any[][]) {
    let seen: any = [];
    let dataFrameToReturn: any[][] = [];
    dataFrame.forEach((row) => {
        let id = row[0];

        if (seen.includes(id)) {
            let idx = dataFrame.indexOf(row);
            dataFrame.splice(idx, 1);
            return;
        }

        seen.push(id);
        dataFrameToReturn.push(row);
    });

    return dataFrameToReturn;
}

/**
 * BLAS function to match tx event with rx event from a pair of nodes.
 * @returns a promise that resolves to
 *      finalAssoc --> 
        [
        [[txID, timing], [rxID, timing], deltaT]],
        [[txID, timing], [rxID, timing], deltaT]],...
        ]
 */
export async function assocRxTx(p: Problem, nhypothesis = 30) {


    return import("ts-gaussian").then((gausLib) => {
        let firstState: State = {
            score: 0,
            backlink: undefined,
            assoc: undefined,
            i: 0,
            j: 0,
            mean: p.mean,
            std: p.std
        };

        // console.log(p.delay(12,12));
        // console.log(p.passoc(12,12));
        // console.log(p.pfalse(12));
        let setOfStates = [firstState];

        for (let j = 0; j < p.rx.length; j++) {
            let setOfStatesPlus: State[] = [];
            let rx = p.rx[j][1];
            for (let state of setOfStates) {
                let timeDistribution = new gausLib.Gaussian(state.mean, state.std ** 2); // Gaussian distribution here expects variance which is std^2
                let pfalse = p.pfalse(rx);
                let prob = pfalse * timeDistribution.pdf(state.mean);
                setOfStatesPlus.push({
                    score: state.score + Math.log10(prob),
                    backlink: state,
                    assoc: undefined,
                    i: state.i,
                    j: j,
                    mean: state.mean,
                    std: state.std
                });

                for (let i = 0; i < p.tx.length; i++) {
                    let tx = p.tx[i][1];    //iterate through all tx timings
                    let deltaTime = (rx - tx) - p.delay(tx, rx);
                    if (deltaTime < -3 * state.std) {
                        break;
                    }

                    prob = (1 - pfalse) * timeDistribution.pdf(deltaTime) * p.passoc(tx, rx);
                    let assocPair = [i, j];
                    // console.log(assocPair);
                    let stateToPush = {
                        score: state.score + Math.log10(prob),
                        backlink: state,
                        assoc: assocPair,
                        i: i,
                        j: j,
                        mean: deltaTime,
                        std: state.std
                    };
                    // console.log(stateToPush);
                    setOfStatesPlus.push(stateToPush);
                }
            }
            setOfStatesPlus.sort((a, b) => b.score - a.score); //reverse order sorted
            if (setOfStates[0].score === Infinity) {
                console.log(`Ran out of possibilities for RX[${j}]!`);
                console.log(setOfStatesPlus);
                break;
            }

            setOfStatesPlus.filter(s => s.score >= setOfStatesPlus[0].score - 1);
            setOfStatesPlus.filter(s => !isDuplicate(s, setOfStatesPlus));
            if (setOfStatesPlus.length > nhypothesis) {
                setOfStatesPlus = setOfStatesPlus.slice(0, nhypothesis);
            }
            setOfStates = setOfStatesPlus;
        }
        let assoc: any[][] = [];    //assoc --> [[i1, j1], [i2, j2]]
        let state: State | undefined = setOfStates[0];
        console.log(setOfStates);
        while (state !== undefined) {
            if ((state.assoc !== undefined)) {
                assoc.push(state.assoc);    // state.assoc --> [i, j] where i: tx idx; j: rx idx
            }
            state = state.backlink;
        }
        assoc.sort((a, b) => a[0] - b[0]);  // sort by tx idx
        let finalAssoc: any[][] = [];
        for (let pair of assoc) {
            let tx = p.tx[pair[0]];
            let rx = p.rx[pair[1]];
            let deltaT = rx[1] - tx[1] - p.delay(tx[1], rx[1]);
            let row = [tx, rx, deltaT];
            finalAssoc.push(row);
        }
        /* finalAssoc --> 
        [[[txID, timing], [rxID, timing], deltaT]],
        [[txID, timing], [rxID, timing], deltaT]],...
        ]*/
        return finalAssoc;
    });
}

function isDuplicate(state: State, setOfStates: State[]): boolean {
    for (let s of setOfStates) {
        if (s === state) {
            continue;
        } else if (s.i !== state.i || s.j !== state.j || s.assoc !== state.assoc) {
            continue;
        } else if (state.score > s.score) {
            continue;
        } else if (state.score < s.score) {
            return true;
        } else if (sha1(state) < sha1(s)) {
            return true;    //if scores are same, discard state if it has a lower hash value than s. Arbitrary tiebreaker
        }
    }
    return false;
}

export function align(groupEvents: Array<{ [header: string]: any }>, clockDrift: number, wsPath: string, tracePathB: string, simulationGroup: string) {
    let fileName = tracePathB.substring(tracePathB.lastIndexOf('/') + 1);
    let savePath = path.join(wsPath, "aligned/");
    console.log(savePath + fileName);
    let fd = fs.openSync(savePath + fileName, 'w');

    fs.writeSync(fd, `{"version": "1.0","group":"EventTrace","events":[\n`);
    fs.writeSync(fd, `    {"group":"${simulationGroup}","events":[\n`);
    for (let i = 0; i < groupEvents.length - 1; i++) {
        //for each event; where event is {time, component, stimulus, response}
        let event = groupEvents[i];
        if ("time" in event) {
            let time = event["time"];
            let alignedEvent = `     {"time":${time - clockDrift}, "component":"${event.component}", "threadID":"${event.threadID}", "stimulus":${JSON.stringify(event.stimulus)}, "response":${JSON.stringify(event.response)}},\n`;
            fs.writeSync(fd, alignedEvent);
        }
    }
    let lastEvent = groupEvents[groupEvents.length - 1];
    if ("time" in lastEvent) {
        let time = lastEvent["time"];
        let alignedEvent = `     {"time":${time - clockDrift}, "component":"${lastEvent.component}", "threadID":"${lastEvent.threadID}", "stimulus":${JSON.stringify(lastEvent.stimulus)}, "response":${JSON.stringify(lastEvent.response)}}\n`;
        fs.writeSync(fd, alignedEvent);
    }
    fs.writeSync(fd, `    ]}\n]}`);
    fs.close(fd);
}


/**
 * function to merge individual aligned trace files
 * @param alignedPath the path to the folder containing all aligned trace files
 * @param simulationGroup the name of the simulation group that the user chose
 * @returns the path of where the merged trace file is saved e.g. D:\unet-3.4.0\aligned\traceFINAL.json
 */
export function merge(alignedPath: string, simulationGroup: string) {

    let final = {
        version: '1.0',
        group: 'EventTrace',
        events: [{
            group: simulationGroup,
            events: []
        }]
    };

    let files = fs.readdirSync(alignedPath);
    for (let file of files) {
        if (file === 'traceFINAL.json') {
            continue;
        }
        let raw = fs.readFileSync(`${alignedPath}/${file}`, { encoding: "utf8" });
        let obj = JSON.parse(raw);
        obj.events.forEach((group: { [header: string]: any }) => {
            if (group.group === simulationGroup) {
                final.events[0].events = final.events[0].events.concat(group.events);
            }
        });
    }
    final.events[0].events.sort((a: { [header: string]: any }, b: { [header: string]: any }) => {
        return a.time - b.time;
    });
    fs.writeFileSync(alignedPath + '/traceFINAL.json', JSON.stringify(final, null, 4));
    // console.log(final);
    return alignedPath + '/traceFINAL.json';
};

function makeid(length: number) {
    let result = '';
    let characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}


/**
 * inserts halfduplex event into combined trace file
 * @param combinedFilePath the path of the trace file with all combined events after alignment
 */
export function half(combinedFilePath: string) {

    let inform = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "recipient": "" } };
    let agree = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "recipient": "" } };
    let txnotif = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" } };
    let rxnotif = { "time": [], "component": "", "threadID": "", "stimulus": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" }, "response": { "clazz": "", "messageID": "", "performative": "", "sender": "", "recipient": "" } };
    //const files = './tests/test.json';
    //let obj = JSON.parse(files);
    let file = fs.readFileSync(combinedFilePath, {encoding: 'utf8'});
    let obj = JSON.parse(file);
    let events = obj.events[0].events;
    let length = events.length;
    var i;
    var j;
    for (i = 0; i <= length; i++) {
        if (events[i].response.clazz.includes('TxFrame')) {
            for (j = i; j <= length; j++) {
                if (events[j].stimulus.clazz.includes('RxFrame')) {
                    let sender = events[i];
                    let receive = events[j];
                    inform.time = sender.time + 3;
                    inform.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    inform.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    inform.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    inform.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    inform.stimulus.performative = "REQUEST";
                    inform.stimulus.sender = sender.stimulus.recipient;
                    inform.stimulus.recipient = "phy";
                    inform.response.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    inform.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11);//9913082f-0891-40be-8b8a-c62cf68063ae
                    inform.response.performative = "INFORM";
                    inform.response.recipient = "phy";
                    agree.time = sender.time + 6;
                    agree.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    agree.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    agree.stimulus.clazz = "org.arl.unet.phy.TxFrameReq";
                    agree.stimulus.messageID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    agree.stimulus.performative = "REQUEST";
                    agree.stimulus.sender = sender.stimulus.recipient;
                    agree.stimulus.recipient = "phy";
                    agree.response.clazz = "org.arl.fjage.Message";
                    agree.response.messageID = inform.response.messageID;//9913082f-0891-40be-8b8a-c62cf68063ae
                    agree.response.performative = "AGREE";
                    agree.response.recipient = "phy";
                    rxnotif.time = sender.time + 12;
                    rxnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + receive.component.substr(receive.component.length - 1);
                    rxnotif.threadID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    rxnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    rxnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    rxnotif.stimulus.performative = "INFORM";
                    rxnotif.stimulus.sender = "phy";
                    rxnotif.stimulus.recipient = "phy";
                    rxnotif.response.clazz = "org.arl.unet.phy.RxFrameNtf";
                    rxnotif.response.messageID = receive.threadID;//12995b36-b42d-4277-bd2d-9936ee4a2d29
                    rxnotif.response.performative = "INFORM";
                    rxnotif.response.sender = "phy";
                    rxnotif.response.recipient = "#phy__ntf";
                    txnotif.time = sender.time + 9;
                    txnotif.component = "phy::org.arl.unet.sim.HalfDuplexModem/" + sender.component.substr(sender.component.length - 1);
                    txnotif.threadID = sender.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe;
                    txnotif.stimulus.clazz = "org.arl.unet.sim.HalfDuplexModem$TX";
                    txnotif.stimulus.messageID = inform.response.messageID;//9679e2db-fa63-4e98-93eb-5b13554aaffe
                    txnotif.stimulus.performative = "INFORM";
                    txnotif.stimulus.sender = "phy";
                    txnotif.stimulus.recipient = "phy";
                    txnotif.response.clazz = "org.arl.unet.phy.TxFrameNtf";
                    txnotif.response.messageID = makeid(8) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(4) + "-" + makeid(11);//c26d1081-48fd-4afe-af0d-426e5e6c7d21
                    txnotif.response.performative = "INFORM";
                    txnotif.response.sender = "phy";
                    txnotif.response.recipient = sender.stimulus.recipient;
                    events.splice(i + 1, 0, inform, agree, txnotif, rxnotif);
                    break;
                }
            }
        }
    }
    obj.events[0].events = events;
    fs.writeFileSync(combinedFilePath, JSON.stringify(obj, null, 4));
    console.log(obj);
};
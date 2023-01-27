/* eslint-disable no-useless-escape */
import { TreeCache, TreeNode } from "./types";
import { Queue } from "./classes/Queue";

/**
 * A function to split the component into useful parts.
 * @param s the component string
 * @returns an array containing split component parts
 */
function splitComponents(s: string) {
    const regexName = /\w.*(?=::)/;
    const regexClazz = /[^\.]*(?=\/)/;
    const regexNode = /[^\/]*$/;

    const regName = regexName.exec(s);
    let compName = "";
    if (regName) {
        compName = regName[0];
    }
    const regClazz = regexClazz.exec(s);
    let compClazz = "";
    if (regClazz) {
        compClazz = regClazz[0];
    }
    const regNode = regexNode.exec(s);
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
        const id: string = eventRow["threadID"];
        if (id in cache) {
            return cache[id];
        }
    }
    if ("stimulus" in eventRow) {
        const id: string = eventRow["stimulus"]["messageID"];
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
        const id: string = eventRow["threadID"];
        cache[id] = traceID;
    }
    if ("stimulus" in eventRow) {
        const id: string = eventRow["stimulus"]["messageID"];
        cache[id] = traceID;
    }
    if ("response" in eventRow) {
        const id: string = eventRow["response"]["messageID"];
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
    const p = clazz.lastIndexOf(".");
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
    const traces: Array<[number, string, Array<{ [header: string]: any }>]> = [];
    const cache: { [id: string]: number; } = {};
    for (let i = 0; i < events.length; i++) {
        const eventRow = events[i];
        let traceID = findTrace(cache, eventRow);
        if (traceID === undefined) {
            const compArray = splitComponents(eventRow["component"]);
            const cname = compArray[0];
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
    const originKey = msg["messageID"] + "->" + recipient;
    if (originKey in origin) {
        const n = origin[originKey];
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
        const p = clazz.lastIndexOf('.');
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
    const actors: Array<[string, string]> = [];
    const msgs: Array<[number, string, string, string]> = [];
    const origin: { [trf: string]: string; } = {};
    const treeCache: TreeCache = {};
    for (let i = 0; i < events.length; i++) {
        const compArray = splitComponents(events[i]["component"]);
        const cname = compArray[0];
        const cnode = compArray[2];

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
    const d: { [x: string]: any } = {};
    const out : [string, string][] = [];
    for (let i = 0; i < actors.length; i++) {
        const item = actors[i];
        const rep = item.toString();

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
        const a = actors[i];
        const id = a[1].replace('/', '_');
        output += `  participant ${id} as ${a[1]}\n`;
    }
    for (let j = 0; j < msgs.length; j++) {
        const msg = msgs[j];
        const id1 = msg[2].replace('/', '_');
        const id2 = msg[3].replace('/', '_');
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
        const p = stimClazz.lastIndexOf('.');
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
        const p = clazz.lastIndexOf('.');
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
    const resp: TreeNode = {
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
    const queue = new Queue<TreeNode>();
    const outList: TreeNode[] = [];
    queue.push(current);
    while (!queue.isEmpty()) {
        current = queue.pop();
        // add current node to list
        outList.push(current);

        // add any children of current node to queue
        for (const child in current.children) {
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
    for (const node of events) {
        htmlContent += `<div class="${currentContainer}">
		<div id="${node.id}" class="content">
		  <h2>Time: ${node.time}</h2>
		  <p>
            id: ${node.id}<br><br>`;    //adding id to event container

        const parentID = Object.keys(node.parent); //each node aside from root should have 1 parent
        //adding parent to event container if exists
        if (parentID.length > 0) {
            htmlContent += `parent: <a href="#${parentID[0]}">${parentID[0]}</a><br><br>`;
        } else {
            htmlContent += `parent: No Parent<br><br>`;
        }

        const childrenIDs = Object.keys(node.children);   //getting the children IDs from a particular event
        //adding children to event container if it exists
        htmlContent += `children: `;
        if (childrenIDs.length > 0) {
            for (const child of childrenIDs) {
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
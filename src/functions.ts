import { TreeCache, TreeNode } from "./types";
import { Stack } from "./classes/Stack";

/**
 * A function to split the component into useful parts.
 * @param s the component string
 * @returns an array containing split component parts
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
 * @returns list of tuples of size = num_of_traces e.g. [(time, desc, traceOfEvents), ...]
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
        }
        else {
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
 * @returns a pair containing: (i) a list of unique sorted actors, (ii) a list of sequenced messages
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
        //update the head of TreeCache
        cache["head"] = stim;
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

export function inOrderTraversal(root: TreeNode) {
    let current = root;
    let stack = new Stack<TreeNode>();
    stack.push(current);
    while (!stack.isEmpty()) {
        current = stack.pop();
        // build html element from current node

        for (let child in current.children) {
            stack.push(current.children[child]);
        }
    }
}
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/functions.ts":
/*!**************************!*\
  !*** ./src/functions.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.mermaid = exports.sequence = exports.analyse = void 0;
/**
 * A function to split the component into useful parts.
 * @param s the component string
 * @returns an array containing split component parts
 */
function splitComponents(s) {
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
function findTrace(cache, eventRow) {
    if ("threadID" in eventRow) {
        let id = eventRow["threadID"];
        if (id in cache) {
            return cache[id];
        }
    }
    if ("stimulus" in eventRow) {
        let id = eventRow["stimulus"]["messageID"];
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
function addToCache(cache, eventRow, traceID) {
    if ("threadID" in eventRow) {
        let id = eventRow["threadID"];
        cache[id] = traceID;
    }
    if ("stimulus" in eventRow) {
        let id = eventRow["stimulus"]["messageID"];
        cache[id] = traceID;
    }
    if ("response" in eventRow) {
        let id = eventRow["response"]["messageID"];
        cache[id] = traceID;
    }
}
/**
 * A function to pretty print a message.
 * @param msg either a stimulus or response message from a given event
 * @returns a string that is pretty formatted
 */
function prettyMessage(msg) {
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
function analyse(events) {
    let traces = [];
    let cache = {};
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
            }
            else if ("response" in eventRow) {
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
exports.analyse = analyse;
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
function capture(actors, msgs, origin, node, agent, time, msg, stimulus) {
    if (!("recipient" in msg)) {
        return;
    }
    let recipient = msg["recipient"];
    if (recipient.startsWith('#')) {
        if (!stimulus) {
            return;
        }
        recipient = agent;
    }
    let originNode = node;
    let originKey = msg["messageID"] + "->" + recipient;
    if (originKey in origin) {
        let n = origin[originKey];
        if (originNode === n) {
            return;
        }
        originNode = n;
    }
    if (stimulus && !("sender" in msg)) {
        return;
    }
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
    }
    else {
        let p = clazz.lastIndexOf('.');
        if (p !== -1) {
            //get the last clazz after the last '.'
            clazz = clazz.substring(p + 1);
        }
    }
    origin[originKey] = node;
    if (sender === recipient) {
        return;
    }
    actors.push([originNode, sender]);
    actors.push([node, recipient]);
    msgs.push([time, clazz, sender, recipient]);
}
/**
 * A public function that sequences the events in a given trace.
 * @param events the Array of events for a given trace
 * @returns a pair containing: (i) a list of unique sorted actors, (ii) a list of sequenced messages
 */
function sequence(events) {
    let actors = [];
    let msgs = [];
    let origin = {};
    let treeCache = {};
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
    let d = {};
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
exports.sequence = sequence;
function sortFunction(a, b) {
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
function mermaid(actors, msgs) {
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
        if (msg[1] === "AGREE") {
            output += '-';
        }
        output += `->>${id2}: ${(msg[1])}\n`;
    }
    return output;
}
exports.mermaid = mermaid;
/**
 * Function to find a node in tree.
 * @param cache the cache that is storing the tree
 * @param msgID the key used to retrieve the node; the stimulus.messageID
 * @returns the node if present, otherwise undefined
 */
function findNode(cache, msgID) {
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
function updateTree(stimulus, response, cache, time, node, agent) {
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
    }
    else {
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
    let resp = {
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


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const path_1 = __webpack_require__(/*! path */ "path");
const vscode = __webpack_require__(/*! vscode */ "vscode");
const vscode_1 = __webpack_require__(/*! vscode */ "vscode");
const fs = __webpack_require__(/*! fs */ "fs");
const functions_1 = __webpack_require__(/*! ./functions */ "./src/functions.ts");
function activate(context) {
    console.log('Congratulations, your extension "UnetTrace" is now active!');
    var output;
    let disposable = vscode.commands.registerCommand('unettrace.generateTrace', () => {
        let ws = vscode.workspace.workspaceFolders;
        let rootPathStr = ".";
        if (ws) {
            rootPathStr = ws[0].toString();
        }
        let od = { canSelectFiles: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr), filters: { "json": ["json"] } };
        let p1 = vscode.window.showOpenDialog(od);
        p1.then((result) => {
            console.log(result);
            if (result !== undefined) {
                vscode.window.showInformationMessage(result[0].path);
                let tracePath = result[0].path;
                tracePath = tracePath.substring(1); // remove first slash from path provided by vscode API
                let rawData = fs.readFileSync(tracePath);
                let traceObj = JSON.parse(rawData.toString());
                // console.log(traceObj.events);
                for (let i = 0; i < traceObj.events.length; i++) {
                    // for (let j = 0; j < traceObj.events[i].events.length; j++) {
                    // 	// console.log(traceObj.events[i].events[j]);
                    // 	// console.log(splitComponents(traceObj.events[i].events[j]["component"]));
                    // }
                    let traces = (0, functions_1.analyse)(traceObj.events[i].events);
                    // console.log(traces);
                    let sequenceResult = (0, functions_1.sequence)(traces[3][2]);
                    if (sequenceResult !== undefined) {
                        // console.log(sequenceResult[2]);
                        // output = sequenceResult[2];
                        output = (0, functions_1.mermaid)(sequenceResult[0], sequenceResult[1]);
                        // console.log(output);
                    }
                }
            }
        });
    });
    let disposable1 = vscode.commands.registerCommand('unettrace.openWebview', () => {
        const panel = vscode.window.createWebviewPanel('Trace webview', 'Trace Webview', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        panel.webview.onDidReceiveMessage(message => {
            const { command, requestId, payload } = message;
            var text;
            if (command === "GET_DATA") {
                // Do something with the payload
                if (output == undefined) {
                    text = "Upload trace.json file first";
                }
                else {
                    text = output;
                }
                // Send a response back to the webview
                panel.webview.postMessage({
                    command,
                    requestId,
                    payload: text
                });
            }
            else if (command === "GET_DATA_ERROR") {
                panel.webview.postMessage({
                    command,
                    requestId,
                    error: `Oops, something went wrong!`
                });
            }
            else if (command === "POST_DATA") {
                vscode.window.showInformationMessage(`Received data from the webview: ${payload.msg}`);
            }
        }, undefined, context.subscriptions);
        panel.webview.html = getWebviewContent(context, panel.webview);
    });
    context.subscriptions.push(disposable);
    context.subscriptions.push(disposable1);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
const getWebviewContent = (context, webview) => {
    const jsFile = "webview.js";
    const localServerUrl = "http://localhost:9000";
    let scriptUrl = null;
    let cssUrl = null;
    const isProduction = context.extensionMode === vscode_1.ExtensionMode.Production;
    if (isProduction) {
        scriptUrl = webview.asWebviewUri(vscode_1.Uri.file((0, path_1.join)(context.extensionPath, 'dist', jsFile))).toString();
    }
    else {
        scriptUrl = `${localServerUrl}/${jsFile}`;
    }
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		${isProduction ? `<link href="${cssUrl}" rel="stylesheet">` : ''}
	</head>
	<body>
		<div id="root"></div>

		<script src="${scriptUrl}" />
	</body>
	</html>`;
};

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map
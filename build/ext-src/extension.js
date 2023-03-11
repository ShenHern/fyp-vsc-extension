"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prefer-const */
const vscode = require("vscode");
const path = require("path");
const extFunctions_1 = require("./extFunctions");
const fs = require("fs");
function activate(context) {
    const disposable1 = vscode.commands.registerCommand('fyp-react-webappbuilder.combine', () => __awaiter(this, void 0, void 0, function* () {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showWarningMessage("Please open a workspace folder");
            return;
        }
        let ws = vscode.workspace.workspaceFolders;
        let wsPath = ws[0].uri.path;
        wsPath = wsPath.substring(1);
        let mergePath = (0, extFunctions_1.merge)(path.join(wsPath, "aligned"));
        (0, extFunctions_1.half)(mergePath);
    }));
    const disposable2 = vscode.commands.registerCommand("fyp-react-webappbuilder.solve", () => __awaiter(this, void 0, void 0, function* () {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        //TODO: open two files and run tx-rx matching for nodes AB then swap and run tx-rx for BA
        //return the matched threaIDs
        if (vscode.workspace.workspaceFolders === undefined) {
            vscode.window.showWarningMessage("Please open a workspace folder");
            return;
        }
        let ws = vscode.workspace.workspaceFolders;
        let rootPathStr = ws[0].uri.path;
        let od = { canSelectFiles: true, canSelectMany: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr), filters: { "json": ["json"] } };
        let p1 = vscode.window.showOpenDialog(od);
        let txA;
        let rxA;
        let txB;
        let rxB;
        let result = yield p1;
        console.log(result);
        if (result === undefined) {
            return;
        }
        //extract tx and rx nodes from two trace files; i.e., result[0] and result[1]
        let tracePathA = result[0].path;
        tracePathA = tracePathA.substring(1); // remove first slash from path provided by vscode API
        let tracePathB = result[1].path;
        tracePathB = tracePathB.substring(1);
        let simulationGroup;
        //ask for delay between the nodes
        const twoNodeDelay = vscode.window.showInputBox({ placeHolder: "Please enter propogation delay between 2 nodes (in seconds)" });
        let delayInSeconds = yield twoNodeDelay;
        if (delayInSeconds === undefined) {
            return;
        }
        vscode.window.showInformationMessage(result[0].path);
        let arrOfGroupsStream = (0, extFunctions_1.createJsonStream)(tracePathA);
        /* arrOfGroups looks like this:
            {key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
            {key: 1, value: group2}
        */
        let groupQuckPickIndex = 1;
        // stream the json file
        arrOfGroupsStream.on('data', (group) => {
            let groupStringArray = [];
            // create string array that will be used to display groups for user to select
            groupStringArray.push(`${groupQuckPickIndex}.\t${group.value.group}`);
            groupStringArray.push("Go to Next Group");
            arrOfGroupsStream.pause();
            //create quick pick windows to display the different groups of events
            // display the quickpick window for event group selection
            vscode.window.showQuickPick(groupStringArray).then(result => {
                if (result === undefined) {
                    return result;
                }
                if (result === "Go to Next Group") {
                    return result;
                }
                else {
                    return group.value.events;
                }
            }).then(groupEvents => {
                if (groupEvents === undefined) {
                    throw new Error("Invalid group of Events");
                }
                else if (groupEvents === "Go to Next Group") {
                    groupQuckPickIndex++;
                    arrOfGroupsStream.resume();
                    return groupEvents;
                }
                let sender = (0, extFunctions_1.extractNode)(groupEvents);
                return [sender, groupEvents];
            }).then((sender) => {
                if (sender === "Go to Next Group") {
                    return;
                }
                /* sender looks like:
                    [senderName, [event1, event2, ...]]
                */
                let arrOfGroupsStreamB = (0, extFunctions_1.createJsonStream)(tracePathB);
                /* arrOfGroups looks like this:
                    {key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
                    {key: 1, value: group2}
                */
                let groupQuckPickIndexB = 1;
                // stream the json file
                arrOfGroupsStreamB.on('data', (group) => {
                    let groupStringArray = [];
                    // create string array that will be used to display groups for user to select
                    groupStringArray.push(`${groupQuckPickIndexB}.\t${group.value.group}`);
                    groupStringArray.push("Go to Next Group");
                    arrOfGroupsStreamB.pause();
                    //create quick pick windows to display the different groups of events
                    // display the quickpick window for event group selection
                    vscode.window.showQuickPick(groupStringArray).then(result => {
                        if (result === undefined) {
                            return result;
                        }
                        if (result === "Go to Next Group") {
                            return result;
                        }
                        else {
                            simulationGroup = group.value.group;
                            return group.value.events;
                        }
                    }).then(groupEvents => {
                        if (groupEvents === undefined) {
                            throw new Error("Invalid group of Events");
                        }
                        else if (groupEvents === "Go to Next Group") {
                            groupQuckPickIndexB++;
                            arrOfGroupsStreamB.resume();
                            return;
                        }
                        let receiver = (0, extFunctions_1.extractNode)(groupEvents);
                        txA = (0, extFunctions_1.extractTxToDataframe)(receiver, sender[1]);
                        rxB = (0, extFunctions_1.extractRxToDataframe)(sender[0], groupEvents);
                        arrOfGroupsStreamB.destroy();
                        arrOfGroupsStream.destroy();
                        return [txA, rxB];
                    }).then((dataframes) => __awaiter(this, void 0, void 0, function* () {
                        if (dataframes === undefined) {
                            throw new Error('tx and rx dataframes are undefined');
                        }
                        let probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
                        let probString = yield probabilities;
                        while (probString === undefined) {
                            probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
                            probString = yield probabilities;
                        }
                        let probStringArr = probString.split(', ');
                        console.log(probStringArr);
                        console.log(dataframes);
                        //BLAS txA and rxB
                        let problem = {
                            tx: dataframes[0],
                            rx: dataframes[1],
                            mean: Number(delayInSeconds),
                            std: 10.0,
                            delay: (tx, rx) => Number(probStringArr[0]),
                            passoc: (tx, rx) => Number(probStringArr[1]),
                            pfalse: (rx) => Number(probStringArr[2])
                        };
                        const assocPromise = (0, extFunctions_1.assocRxTx)(problem);
                        let assocDataframe = yield assocPromise;
                        console.log(assocDataframe);
                        let deltaT = 0;
                        for (let row of assocDataframe) {
                            deltaT += row[2];
                        }
                        deltaT = Math.floor(deltaT / assocDataframe.length);
                        let clockDrift = deltaT - Number(delayInSeconds);
                        // align traceB by minusing clockDrift from its timing
                        let wsPath = ws[0].uri.path.substring(1);
                        if (group.value.group === simulationGroup) {
                            let groupEvents = group.value.events;
                            console.log("Checking for directory " + path.join(wsPath, "aligned"));
                            let exists = fs.existsSync(path.join(wsPath, "aligned"));
                            console.log(exists);
                            // align traceB by minusing clockDrift from its timing
                            if (exists === false) {
                                fs.mkdirSync(path.join(wsPath, "aligned"));
                            }
                            //align nodeB
                            (0, extFunctions_1.align)(groupEvents, clockDrift, wsPath, tracePathB, simulationGroup);
                            // copy traceA to the folder 'aligned/'
                            let fileName = tracePathA.substring(tracePathA.lastIndexOf('/') + 1);
                            fs.copyFile(tracePathA, path.join(wsPath, "aligned/") + fileName, () => { });
                        }
                    }));
                });
            });
        });
    }));
    const disposableSidePreview = vscode.commands.registerCommand("fyp-react-webappbuilder.start", () => __awaiter(this, void 0, void 0, function* () {
        initReactApp(context);
    }));
    context.subscriptions.push(disposableSidePreview);
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}
exports.activate = activate;
function initReactApp(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let currentTextEditor = vscode.window.visibleTextEditors[0];
        const panel = vscode.window.createWebviewPanel("liveHTMLPreviewer", "Unet Trace Visualisation", 2, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, "build")),
                vscode.Uri.file(path.join(context.extensionPath, "assets")),
            ],
        });
        panel.webview.postMessage({
            json: currentTextEditor.document.getText(),
        });
        const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor((editor) => {
            currentTextEditor = editor;
        });
        const onTextChange = vscode.workspace.onDidChangeTextDocument((changeEvent) => {
            panel.webview.postMessage({
                json: changeEvent.document.getText(),
            });
        });
        panel.onDidDispose(() => {
            onTextChange.dispose();
            onActiveEditorChange.dispose();
        }, null, context.subscriptions);
        const manifest = require(path.join(context.extensionPath, "build", "asset-manifest.json"));
        const mainScript = manifest.files["main.js"];
        const mainStyle = manifest.files["main.css"];
        const basePathOnDisk = vscode.Uri.file(path.join(context.extensionPath, "build"));
        const scriptPathOnDisk = vscode.Uri.file(path.join(context.extensionPath, "build", mainScript));
        const stylePathOnDisk = vscode.Uri.file(path.join(context.extensionPath, "build", mainStyle));
        // const styleUri = stylePathOnDisk.with({ scheme: "vscode-resource" });
        //const baseUri = panel.webview.asWebviewUri(basePathOnDisk);
        const stylesMainUri = panel.webview.asWebviewUri(stylePathOnDisk);
        const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);
        const nonce = getNonce();
        panel.webview.html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'unsafe-inline' 'unsafe-eval' vscode-resource: data: https: http:;">

    <link href="${stylesMainUri}" rel="stylesheet">
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
  </html>`;
    });
}
// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
function deactivate() { }
exports.deactivate = deactivate;
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map
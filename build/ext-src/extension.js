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
const vscode = require("vscode");
const path = require("path");
function activate(context) {
    const disposableSidePreview = vscode.commands.registerCommand("fyp-react-webappbuilder.start", () => __awaiter(this, void 0, void 0, function* () {
        initReactApp(context);
    }));
    context.subscriptions.push(disposableSidePreview);
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
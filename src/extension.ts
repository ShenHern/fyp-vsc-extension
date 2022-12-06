// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { join } from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri, Webview } from 'vscode';
import fs = require('fs');
import { analyse, mermaid, sequence } from './functions';
import { MessageHandlerData } from '@estruyf/vscode';
import { TreeNode } from './types';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "UnetTrace" is now active!');
	var output : any;

	let disposable = vscode.commands.registerCommand('unettrace.generateTrace', () => {
		let ws = vscode.workspace.workspaceFolders;
		let rootPathStr = ".";
		if (ws) {
			rootPathStr = ws[0].toString();
		}
		let od: vscode.OpenDialogOptions = { canSelectFiles: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr), filters: { "json": ["json"] } };
		let p1 = vscode.window.showOpenDialog(od);
		p1.then(
			(result) => {
				console.log(result);
				if (result !== undefined) {
					vscode.window.showInformationMessage(result[0].path);
					let tracePath = result[0].path;
					tracePath = tracePath.substring(1);	// remove first slash from path provided by vscode API
					let rawData = fs.readFileSync(tracePath);
					let traceObj = JSON.parse(rawData.toString());
					// console.log(traceObj.events);
					for (let i = 0; i < traceObj.events.length; i++) {
						// for (let j = 0; j < traceObj.events[i].events.length; j++) {
						// 	// console.log(traceObj.events[i].events[j]);
						// 	// console.log(splitComponents(traceObj.events[i].events[j]["component"]));
						// }
						let traces = analyse(traceObj.events[i].events);
						// console.log(traces);
						let sequenceResult = sequence(traces[3][2]);
						if (sequenceResult !== undefined){
							// console.log(sequenceResult[2]);
							// output = sequenceResult[2];
							output = mermaid(sequenceResult[0], sequenceResult[1]);
							// console.log(output);
						}
					}
				}
			}
		);
	});

	let disposable1 = vscode.commands.registerCommand('unettrace.openWebview', () => {
		const panel = vscode.window.createWebviewPanel(
			'Trace webview',
			'Trace Webview',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true
			}
		);

		panel.webview.onDidReceiveMessage(message => {
			const { command, requestId, payload } = message;
			var text : String;
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
					requestId, // The requestId is used to identify the response
					payload: text
				} as MessageHandlerData<string>);
			} else if (command === "GET_DATA_ERROR" ) {
				panel.webview.postMessage({
					command,
					requestId, // The requestId is used to identify the response
					error: `Oops, something went wrong!`
				} as MessageHandlerData<string>);
			} else if (command === "POST_DATA") {
				vscode.window.showInformationMessage(`Received data from the webview: ${payload.msg}`);
			}
		}, undefined, context.subscriptions);

		panel.webview.html = getWebviewContent(context, panel.webview);
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable1);
}

// this method is called when your extension is deactivated
export function deactivate() {}


const getWebviewContent = (context: ExtensionContext, webview: Webview) => {
	const jsFile = "webview.js";
	const localServerUrl = "http://localhost:9000";

	let scriptUrl = null;
	let cssUrl = null;

	const isProduction = context.extensionMode === ExtensionMode.Production;
	if (isProduction) {
		scriptUrl = webview.asWebviewUri(Uri.file(join(context.extensionPath, 'dist', jsFile))).toString();
	} else {
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
}
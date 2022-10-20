// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import { analyse, mermaid, sequence } from './functions';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "UnetTrace" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('unettrace.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from VSCode!');
	});

	let disposable2 = vscode.commands.registerCommand('unettrace.helloWorld2', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showWarningMessage('Hello World 2!');
	});

	let disposable3 = vscode.commands.registerCommand('unettrace.trace', () => {
		// The code you place here will be executed every time your command is executed
		// open a file dialog box
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
							mermaid(sequenceResult[0], sequenceResult[1]);}
					}
				}
			});
	});



	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);
}

// this method is called when your extension is deactivated
export function deactivate() { }

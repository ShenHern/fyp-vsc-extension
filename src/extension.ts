// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { analyse, mermaid, sequence, sortTreeByTime, createHTMLContent, createJsonStream } from './functions';
import { trace } from 'console';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

let currentPanel: vscode.WebviewPanel | undefined = undefined;

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
				if (result === undefined) {
					throw new Error("File not found!");
				}
				vscode.window.showInformationMessage(result[0].path);
				let tracePath = result[0].path;
				tracePath = tracePath.substring(1);	// remove first slash from path provided by vscode API
				let arrOfGroupsStream = createJsonStream(tracePath);
				/* arrOfGroups looks like this:
					{key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
					{key: 1, value: group2}
				*/
				let groupStringArray: Array<string> = [];
				let groupQuckPickIndex = 1;
				// stream the json file once to collate the group names
				arrOfGroupsStream.on('data', (group) => {
					// create string array that will be used to display groups for user to select
					groupStringArray.push(`${groupQuckPickIndex}.\t${group.value.group}`);
					groupQuckPickIndex++;
				});

				//create quick pick windows to display the different groups of events
				// display the quickpick window for event group selection
				vscode.window.showQuickPick(groupStringArray).then(
					result => {
						let groupEvents = undefined;
						const regexGroupName = /(?<=\t)[\w+.-]+/;
						if (result === undefined) {
							throw new Error("Group not found.");
						}
						let groupName = regexGroupName.exec(result);
						let arrOfGroupsStream2 = createJsonStream(tracePath);
						arrOfGroupsStream2.on('data', (group) => {
							if (groupName !== group.value.group) { return; }

							groupEvents = group.value.events;
						});
						return groupEvents;
					}
				).then(groupEvents => {
					if (groupEvents === undefined) {
						throw new Error("Invalid group of Events");
					}
					//analysing events to find traces
					let traces = analyse(groupEvents);
					//display the traces of a given group
					let traceStringArray = [];
					let traceQuickPickIndex = 1;
					for (let trace of traces) {
						//create string array to display quick pick of traces
						traceStringArray.push(`${traceQuickPickIndex}.\tTime: ${trace[0]}\t${trace[1]}`);
						traceQuickPickIndex++;
					}

					vscode.window.showQuickPick(traceStringArray).then(
						//resolve if user chooses a trace
						(result) => {
							let sequenceIndex = Number(result?.charAt(0));
							//sequencing the traces
							if (traces === undefined || sequenceIndex === undefined) {
								throw new Error("Could not find traces.");
							}
							let sequenceResult = sequence(traces[sequenceIndex - 1][2]);
							if (sequenceResult === undefined) {
								throw new Error("Could not find sequence in trace.");
							}
							console.log(sequenceResult[2]); //root of tree after sequencing a trace

							// level order traversal of tree to create
							let htmlContent = createHTMLContent(sortTreeByTime(sequenceResult[2]));

							//create and show a new webview
							createWebviewPanel(htmlContent);

							let output = mermaid(sequenceResult[0], sequenceResult[1]);
							console.log(output);
						}
					).then(undefined, err => { });
				}).then(undefined, err => { });
			});
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);

	function createWebviewPanel(htmlContent: string) {
		//create and show a new webview
		const columnToShowIn = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (currentPanel) {
			currentPanel.reveal(columnToShowIn);
		} else {
			currentPanel = vscode.window.createWebviewPanel(
				"traceVisualization",
				"Trace Visualization",
				columnToShowIn ? columnToShowIn : vscode.ViewColumn.One,
				{
					enableScripts: true,
				}
			);
		}

		//set the webview html content
		currentPanel.webview.html = htmlContent;

		currentPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
				}
			},
			undefined,
			context.subscriptions
		);

		currentPanel.onDidDispose(
			() => {
				// clearInterval(interval);
				currentPanel = undefined;
				// clearTimeout(timeout);
			},
			null,
			context.subscriptions
		);
	}
}

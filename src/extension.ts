// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import { noDupes, analyse, mermaid, sequence, sortTreeByTime, createHTMLContent, createJsonStream, extractRxToDataframe, extractTxToDataframe, assocRxTx, extractNode, align, merge, half, copyGroup } from './functions';
import { Problem } from './types';
import path = require('path');
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
	let disposable = vscode.commands.registerCommand('unettrace.combine', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
		if (vscode.workspace.workspaceFolders === undefined) {
			vscode.window.showWarningMessage("Please open a workspace folder");
			return;
		}

		let ws = vscode.workspace.workspaceFolders;
		let wsPath = ws[0].uri.path;
		wsPath = wsPath.substring(1);

		let mergePath = merge(path.join(wsPath, "aligned"));

		half(mergePath);
	});

	let disposable2 = vscode.commands.registerCommand('unettrace.solve', async () => {
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
		let od: vscode.OpenDialogOptions = { canSelectFiles: true, canSelectMany: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr), filters: { "json": ["json"] } };
		let p1 = vscode.window.showOpenDialog(od);
		let txA: any[][];
		let rxA: any[][];
		let txB: any[][];
		let rxB: any[][];
		let result = await p1;
		console.log(result);
		if (result === undefined) {
			return;
		}
		//extract tx and rx nodes from two trace files; i.e., result[0] and result[1]
		let tracePathA = result[0].path;
		tracePathA = tracePathA.substring(1);	// remove first slash from path provided by vscode API
		let tracePathB = result[1].path;
		tracePathB = tracePathB.substring(1);
		let simulationGroup: string;


		//ask for delay between the nodes
		const twoNodeDelay = vscode.window.showInputBox({ placeHolder: "Please enter propogation delay between 2 nodes (in seconds)" });
		let delayInSeconds = await twoNodeDelay;

		if (delayInSeconds === undefined) {
			return;
		}

		let delayInMilliseconds = Number(delayInSeconds) * 1000;
		vscode.window.showInformationMessage(result[0].path);

		let arrOfGroupsStream = createJsonStream(tracePathA);
		/* arrOfGroups looks like this:
			{key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
			{key: 1, value: group2}
		*/
		let groupQuckPickIndex = 1;
		// stream the json file
		arrOfGroupsStream.on('data', (group) => {
			let groupStringArray: Array<string> = [];
			// create string array that will be used to display groups for user to select
			groupStringArray.push(`${groupQuckPickIndex}.\t${group.value.group}`);
			groupStringArray.push("Go to Next Group");
			arrOfGroupsStream.pause();

			//create quick pick windows to display the different groups of events
			// display the quickpick window for event group selection
			vscode.window.showQuickPick(groupStringArray).then(
				result => {
					if (result === undefined) {
						return result;
					}
					if (result === "Go to Next Group") {
						return result;
					} else {
						return [group.value.group, group.value.events];
					}
				}
			).then(groupEvents => {
				if (groupEvents === undefined) {
					throw new Error("Invalid group of Events");
				} else if (groupEvents === "Go to Next Group") {
					groupQuckPickIndex++;
					arrOfGroupsStream.resume();
					return groupEvents;
				}
				let simGroup = groupEvents[0];
				let wsPath = ws[0].uri.path.substring(1);
				let sender = extractNode(groupEvents[1]);

				// checking for 'aligned/' dir
				console.log("Checking for directory " + path.join(wsPath, "aligned"));
				let exists = fs.existsSync(path.join(wsPath, "aligned"));
				console.log(exists);
				if (exists === false) {
					fs.mkdirSync(path.join(wsPath, "aligned"));
				}

				copyGroup(groupEvents[1], wsPath, tracePathA, simGroup);

				return [sender, groupEvents[1]];
			}).then((sender) => {
				if (sender === "Go to Next Group") {
					return;
				}
				/* sender looks like:
					[senderName, [event1, event2, ...]]
				*/

				let arrOfGroupsStreamB = createJsonStream(tracePathB);
				/* arrOfGroups looks like this:
					{key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
					{key: 1, value: group2}
				*/
				let groupQuckPickIndexB = 1;
				// stream the json file
				arrOfGroupsStreamB.on('data', (group) => {
					let groupStringArray: Array<string> = [];
					// create string array that will be used to display groups for user to select
					groupStringArray.push(`${groupQuckPickIndexB}.\t${group.value.group}`);
					groupStringArray.push("Go to Next Group");
					arrOfGroupsStreamB.pause();

					//create quick pick windows to display the different groups of events
					// display the quickpick window for event group selection
					vscode.window.showQuickPick(groupStringArray).then(
						result => {
							if (result === undefined) {
								return result;
							}
							if (result === "Go to Next Group") {
								return result;
							} else {
								simulationGroup = group.value.group;
								return group.value.events;
							}
						}
					).then(groupEvents => {
						if (groupEvents === undefined) {
							throw new Error("Invalid group of Events");
						} else if (groupEvents === "Go to Next Group") {
							groupQuckPickIndexB++;
							arrOfGroupsStreamB.resume();
							return;
						}

						let receiver = extractNode(groupEvents);
						txA = noDupes(extractTxToDataframe(receiver, sender[1]));
						rxB = noDupes(extractRxToDataframe(sender[0], groupEvents));

						console.log('txA and rxB incoming...');
						console.log(txA);
						console.log(rxB);

						arrOfGroupsStreamB.destroy();
						arrOfGroupsStream.destroy();

						return [txA, rxB];
					}).then(async (dataframes) => {
						if (dataframes === undefined) {
							throw new Error('tx and rx dataframes are undefined');
						}
						let probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
						let probString = await probabilities;
						while (probString === undefined) {
							probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
							probString = await probabilities;
						}
						let probStringArr = probString.split(', ');
						console.log(probStringArr);
						console.log(dataframes);

						//BLAS txA and rxB
						let problem: Problem = {
							tx: dataframes[0],
							rx: dataframes[1],
							mean: delayInMilliseconds,
							std: 10.0,
							delay: (tx, rx) => Number(probStringArr[0]),
							passoc: (tx, rx) => Number(probStringArr[1]),
							pfalse: (rx) => Number(probStringArr[2])
						};
						//weird hack to use dynamic import of ES module in commonjs context (it prevents 'import' being transpiled to 'require')
						const assoc = assocRxTx;
						const assocPromise = eval(`import('ts-gaussian').then(gausLib => {
							return assoc(gausLib, problem);
						})`);
						//finding average clock drift from all associations
						let assocDataframe = await assocPromise;
						console.log(assocDataframe);
						let deltaT = 0;
						for (let row of assocDataframe) {
							deltaT += row[2];
						}
						deltaT = Math.floor(deltaT / assocDataframe.length);
						let clockDrift = deltaT - delayInMilliseconds;

						let wsPath = ws[0].uri.path.substring(1);

						if (group.value.group === simulationGroup) {
							let groupEvents = group.value.events;
							
							//align nodeB
							align(groupEvents, clockDrift, wsPath, tracePathB, simulationGroup);
						}

					});
				});
			});
		});
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
				let groupQuckPickIndex = 1;
				// stream the json file
				arrOfGroupsStream.on('data', (group) => {
					let groupStringArray: Array<string> = [];
					// create string array that will be used to display groups for user to select
					groupStringArray.push(`${groupQuckPickIndex}.\t${group.value.group}`);
					groupStringArray.push("Go to Next Group");
					arrOfGroupsStream.pause();

					//create quick pick windows to display the different groups of events
					// display the quickpick window for event group selection
					vscode.window.showQuickPick(groupStringArray).then(
						result => {
							if (result === undefined) {
								return result;
							}
							if (result === "Go to Next Group") {
								return result;
							} else {
								return group.value.events;
							}
						}
					).then(groupEvents => {
						if (groupEvents === undefined) {
							throw new Error("Invalid group of Events");
						} else if (groupEvents === "Go to Next Group") {
							groupQuckPickIndex++;
							arrOfGroupsStream.resume();
							return;
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

								// level order traversal of tree to create html content
								let htmlContent = createHTMLContent(sortTreeByTime(sequenceResult[2]));

								//create and show a new webview with the above html content
								createWebviewPanel(htmlContent);

								//create mermaid sequence diagram
								let output = mermaid(sequenceResult[0], sequenceResult[1]);
								console.log(output);

								//end stream
								arrOfGroupsStream.destroy();
							}
						).then(undefined, err => { });
					}).then(undefined, err => { });
				});
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

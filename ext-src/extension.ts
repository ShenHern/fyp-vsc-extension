/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prefer-const */
import * as vscode from "vscode";
import * as path from "path";
// import { createJsonStream, extractNode, copyGroup, noDupes, extractTxToDataframe, extractRxToDataframe, align, assocRxTx, merge, half } from "./extFunctions";
import * as fs from "fs";
import { Problem } from './extTypes';
import { Message } from './messages/messageTypes';
import * as JSONStream from 'jsonstream';
import { sync } from "glob";

export function activate(context: vscode.ExtensionContext) {
	const disposableCombine = vscode.commands.registerCommand(
		"fyp-react-webappbuilder.combine",
		async () => {
			initCombine(context);
		});

	const disposableSolve = vscode.commands.registerCommand(
		"fyp-react-webappbuilder.solve",
		async () => {
			initSolve(context);
		});
	
	const disposableSidePreview = vscode.commands.registerCommand(
		"fyp-react-webappbuilder.start",
		async () => {
			initReactApp(context);
		});

  context.subscriptions.push(disposableSidePreview);
  context.subscriptions.push(disposableCombine);
  context.subscriptions.push(disposableSolve);
}

// async function initSolve(context: vscode.ExtensionContext) {
// 	if (vscode.workspace.workspaceFolders === undefined) {
// 		vscode.window.showWarningMessage("Please open a workspace folder");
// 		return;
// 	}
// 	let ws = vscode.workspace.workspaceFolders;
// 	let rootPathStr = ws[0].uri.path;
// 	let od: vscode.OpenDialogOptions = { canSelectFiles: true, canSelectMany: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr), filters: { "json": ["json"] } };
// 	let p1 = vscode.window.showOpenDialog(od);
// 	let txA: any[][];
// 	let rxA: any[][];
// 	let txB: any[][];
// 	let rxB: any[][];
// 	let result = await p1;
// 	console.log(result);
// 	if (result === undefined) {
// 		return;
// 	}
// 	//extract tx and rx nodes from two trace files; i.e., result[0] and result[1]
// 	let tracePathA = result[0].path;
// 	tracePathA = tracePathA.substring(1);	// remove first slash from path provided by vscode API
// 	let tracePathB = result[1].path;
// 	tracePathB = tracePathB.substring(1);
// 	let simulationGroup: string;


// 	//ask for delay between the nodes
// 	const twoNodeDelay = vscode.window.showInputBox({ placeHolder: "Please enter propogation delay between 2 nodes (in seconds)" });
// 	let delayInSeconds = await twoNodeDelay;

// 	if (delayInSeconds === undefined) {
// 		return;
// 	}

// 	//ask for std dev between the nodes
// 	const twoNodeStd = vscode.window.showInputBox({ placeHolder: "Please enter std deviation of delay between 2 nodes (in seconds)" });
// 	let stdInSeconds = await twoNodeStd;

// 	if (stdInSeconds === undefined) {
// 		return;
// 	}

// 	let delayInMilliseconds = Number(delayInSeconds) * 1000;
// 	let stdInMilliseconds = Number(stdInSeconds) * 1000;
// 	vscode.window.showInformationMessage(result[0].path);

// 	let arrOfGroupsStream = createJsonStream(tracePathA);
// 	/* arrOfGroups looks like this:
// 		{key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
// 		{key: 1, value: group2}
// 	*/
// 	let groupQuckPickIndex = 1;
// 	// stream the json file
// 	arrOfGroupsStream.on('data', (group) => {
// 		let groupStringArray: Array<string> = [];
// 		// create string array that will be used to display groups for user to select
// 		groupStringArray.push(`${groupQuckPickIndex}.\t${group.value.group}`);
// 		groupStringArray.push("Go to Next Group");
// 		arrOfGroupsStream.pause();

// 		//create quick pick windows to display the different groups of events
// 		// display the quickpick window for event group selection
// 		vscode.window.showQuickPick(groupStringArray).then(
// 			result => {
// 				if (result === undefined) {
// 					return result;
// 				}
// 				if (result === "Go to Next Group") {
// 					return result;
// 				} else {
// 					return [group.value.group, group.value.events];
// 				}
// 			}
// 		).then(groupEvents => {
// 			if (groupEvents === undefined) {
// 				throw new Error("Invalid group of Events");
// 			} else if (groupEvents === "Go to Next Group") {
// 				groupQuckPickIndex++;
// 				arrOfGroupsStream.resume();
// 				return groupEvents;
// 			}
// 			let simGroup = groupEvents[0];
// 			let wsPath = ws[0].uri.path.substring(1);
// 			let sender = extractNode(groupEvents[1]);

// 			// checking for 'aligned/' dir
// 			console.log("Checking for directory " + path.join(wsPath, "aligned"));
// 			let exists = fs.existsSync(path.join(wsPath, "aligned"));
// 			console.log(exists);
// 			if (exists === false) {
// 				fs.mkdirSync(path.join(wsPath, "aligned"));
// 			}

// 			copyGroup(groupEvents[1], wsPath, tracePathA, simGroup);

// 			return [sender, groupEvents[1]];
// 		}).then((sender) => {
// 			if (sender === "Go to Next Group") {
// 				return;
// 			}
// 			/* sender looks like:
// 				[senderName, [event1, event2, ...]]
// 			*/

// 			let arrOfGroupsStreamB = createJsonStream(tracePathB);
// 			/* arrOfGroups looks like this:
// 				{key: 0, value: group1}, where group1 = {"group" : "SIMULATION 1", "events": [...]}
// 				{key: 1, value: group2}
// 			*/
// 			let groupQuckPickIndexB = 1;
// 			// stream the json file
// 			arrOfGroupsStreamB.on('data', (group) => {
// 				let groupStringArray: Array<string> = [];
// 				// create string array that will be used to display groups for user to select
// 				groupStringArray.push(`${groupQuckPickIndexB}.\t${group.value.group}`);
// 				groupStringArray.push("Go to Next Group");
// 				arrOfGroupsStreamB.pause();

// 				//create quick pick windows to display the different groups of events
// 				// display the quickpick window for event group selection
// 				vscode.window.showQuickPick(groupStringArray).then(
// 					result => {
// 						if (result === undefined) {
// 							return result;
// 						}
// 						if (result === "Go to Next Group") {
// 							return result;
// 						} else {
// 							simulationGroup = group.value.group;
// 							return group.value.events;
// 						}
// 					}
// 				).then(groupEvents => {
// 					if (groupEvents === undefined) {
// 						throw new Error("Invalid group of Events");
// 					} else if (groupEvents === "Go to Next Group") {
// 						groupQuckPickIndexB++;
// 						arrOfGroupsStreamB.resume();
// 						return;
// 					}

// 					let receiver = extractNode(groupEvents);
// 					txA = noDupes(extractTxToDataframe(receiver, sender[1]));
// 					rxB = noDupes(extractRxToDataframe(sender[0], groupEvents));

// 					console.log('txA and rxB incoming...');
// 					console.log(txA);
// 					console.log(rxB);

// 					arrOfGroupsStreamB.destroy();
// 					arrOfGroupsStream.destroy();

// 					return [txA, rxB];
// 				}).then(async (dataframes) => {
// 					if (dataframes === undefined) {
// 						throw new Error('tx and rx dataframes are undefined');
// 					}
// 					let probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
// 					let probString = await probabilities;
// 					while (probString === undefined) {
// 						probabilities = vscode.window.showInputBox({ placeHolder: 'Enter probabilites for delay, association and false transmission. E.g 0.0, 1.0, 0.1' });
// 						probString = await probabilities;
// 					}
// 					let probStringArr = probString.split(', ');
// 					console.log(probStringArr);
// 					console.log(dataframes);

// 					//BLAS txA and rxB
// 					let problem: Problem = {
// 						tx: dataframes[0],
// 						rx: dataframes[1],
// 						mean: delayInMilliseconds,
// 						std: stdInMilliseconds,
// 						delay: (tx, rx) => Number(probStringArr[0]),
// 						passoc: (tx, rx) => Number(probStringArr[1]),
// 						pfalse: (rx) => Number(probStringArr[2])
// 					};
// 					//weird hack to use dynamic import of ES module in commonjs context (it prevents 'import' being transpiled to 'require')
// 					// const assoc = assocRxTx;
// 					// var eval2 = eval;
// 					// const assocPromise = eval2(`import('ts-gaussian').then(gausLib => {
// 					// 	return assoc(gausLib, problem);
// 					// })`);
// 					//finding average clock drift from all associations
// 					let assocDataframe = assocRxTx(problem);
// 					console.log(assocDataframe);
// 					let deltaT = 0;
// 					for (let row of assocDataframe) {
// 						deltaT += row[2];
// 					}
// 					deltaT = Math.floor(deltaT / assocDataframe.length);
// 					let clockDrift = deltaT - delayInMilliseconds;

// 					let wsPath = ws[0].uri.path.substring(1);

// 					if (group.value.group === simulationGroup) {
// 						let groupEvents = group.value.events;
						
// 						//align nodeB
// 						align(groupEvents, clockDrift, wsPath, tracePathB, simulationGroup);
// 					}

// 				});
// 			});
// 		});
// 	});
// }

async function initSolve(context: vscode.ExtensionContext) {
	let currentTextEditor: vscode.TextEditor | undefined =
		vscode.window.visibleTextEditors[0];

	const panel = vscode.window.createWebviewPanel(
		"liveHTMLPreviewer",
		"Unet Trace Solve",
		2,
		{
		enableScripts: true,
		retainContextWhenHidden: true,
		localResourceRoots: [
			vscode.Uri.file(path.join(context.extensionPath, "build")),
			vscode.Uri.file(path.join(context.extensionPath, "assets")),
			],
		}
	);
	
	if (vscode.workspace.workspaceFolders === undefined) {
		vscode.window.showWarningMessage("Please open a workspace folder");
		return;
	}

	panel.webview.postMessage({
		command: 'solve'
	})
	let simGroup : any;
	let filePath1: any;
	let filePath2: any;
	panel.webview.onDidReceiveMessage(
		async (message: Message) => {
			if (message.type === 'settings') {
			vscode.window.showInformationMessage("Select simulation from each trace");
			filePath1 = message.payload.file1;
			filePath2 = message.payload.file2;

			var streamA = fs.createReadStream(filePath1, { encoding: 'utf8' });
			var streamB = fs.createReadStream(filePath2, { encoding: 'utf8' });
			var parser = JSONStream.parse('events.*');
			var parser2 = JSONStream.parse('events.*');

			streamA.pipe(parser);
			const file_listA = await streamToSimArray(parser);
			streamB.pipe(parser2);
			const file_listB = await streamToSimArray(parser2);
			// var parser = JSONStream.parse('events.*');

			// file_listB = await streamToSimArray(parser);
			const send = {
				fileA: file_listA,
				fileB: file_listB
			}
			panel.webview.postMessage({
				command: "simSelect",
				payload: send
			})

			}
			else if (message.type === 'selectedSIM') {
				const simA = message.payload.simA;
				const simB = message.payload.simB;
				var streamA = fs.createReadStream(filePath1, { encoding: 'utf8' });
				var parser = JSONStream.parse('events.*');
				var streamB = fs.createReadStream(filePath2, { encoding: 'utf8' });
				var parser2 = JSONStream.parse('events.*');
				streamA.pipe(parser);
				const dataA = await streamToDataArray(parser, simA);
				streamB.pipe(parser2);
				const dataB = await streamToDataArray(parser2, simB);
				console.log(dataA);
				console.log(dataB);
			}
		},
		undefined,
		context.subscriptions
	);

	function streamToSimArray (stream : any) {
		const chunks : any = [];
		return new Promise((resolve) => {
			stream.on('data', (chunk : any) => {
				chunks.push(chunk.group)});
			stream.on('end', () => resolve(chunks));
		})
	}

	function streamToDataArray (stream : any, sim : any) {
		const chunks : any = [];
		return new Promise((resolve) => {
			stream.on('data', (chunk : any) => {
				if (chunk.group === sim)
				chunks.push(chunk)});
			stream.on('end', () => resolve(chunks));
		})
	}
	
	const manifest = require(path.join(
		context.extensionPath,
		"build",
		"asset-manifest.json"
	));

	const mainScript = manifest.files["main.js"];
	const mainStyle = manifest.files["main.css"];

	const basePathOnDisk = vscode.Uri.file(
		path.join(context.extensionPath, "build")
	);
	const scriptPathOnDisk = vscode.Uri.file(
		path.join(context.extensionPath, "build", mainScript)
	);
	const stylePathOnDisk = vscode.Uri.file(
		path.join(context.extensionPath, "build", mainStyle)
	);

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
		<script>
			const vscode = acquireVsCodeApi();
		</script>
		<script nonce="${nonce}" src="${scriptUri}"></script>
	</body>
	</html>`;
}

async function initCombine(context: vscode.ExtensionContext) {
	if (vscode.workspace.workspaceFolders === undefined) {
		vscode.window.showWarningMessage("Please open a workspace folder");
		return;
	}

	let ws = vscode.workspace.workspaceFolders;
	let wsPath = ws[0].uri.path;
	wsPath = wsPath.substring(1);

	// let mergePath = merge(path.join(wsPath, "aligned"));

	// half(mergePath);
	//TODO: add in
}

async function initReactApp(context: vscode.ExtensionContext) {
  let currentTextEditor: vscode.TextEditor | undefined =
    vscode.window.visibleTextEditors[0];

  const panel = vscode.window.createWebviewPanel(
    "liveHTMLPreviewer",
    "Unet Trace Visualisation",
    2,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, "build")),
        vscode.Uri.file(path.join(context.extensionPath, "assets")),
      ],
    }
  );

  panel.webview.postMessage({
	command: 'view',
    json: currentTextEditor.document.getText(),
  });

  const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      currentTextEditor = editor;
    }
  );

  const onTextChange = vscode.workspace.onDidChangeTextDocument(
    (changeEvent) => {
      panel.webview.postMessage({
		command: 'view',
        json: changeEvent.document.getText(),
      });
    }
  );

  panel.onDidDispose(
    () => {
      onTextChange.dispose();
      onActiveEditorChange.dispose();
    },
    null,
    context.subscriptions
  );

  const manifest = require(path.join(
    context.extensionPath,
    "build",
    "asset-manifest.json"
  ));

  const mainScript = manifest.files["main.js"];
  const mainStyle = manifest.files["main.css"];

  const basePathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, "build")
  );
  const scriptPathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, "build", mainScript)
  );
  const stylePathOnDisk = vscode.Uri.file(
    path.join(context.extensionPath, "build", mainStyle)
  );

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
}

// this method is called when your extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
function findSimGroup(payload: any) {
	const filePath1 = payload.file1;
	const filePath2 = payload.file2;
	vscode.window.showInformationMessage(filePath1);

	
	let file_listA : any = [];
	let file_listB : any = [];
	var streamA = fs.createReadStream(filePath1, { encoding: 'utf8' });
	var streamB = fs.createReadStream(filePath2, { encoding: 'utf8' });
	var parser = JSONStream.parse('events.*');

	streamA.pipe(parser);
	parser.on('data', (data) => {
		file_listA.push(data.group as any);
	})
	.on('end', (stream) => {
		// console.log(file_listA);
		file_listB = file_listA;
	} )
	
	console.log(file_listB);
	return file_listB
	// console.log(file_listA);
	// console.log(streamA);
	// streamB.pipe(parser);
	// parser.on('data', function (obj : any) {
	// 	file_listB.push(obj.group);
	// })
	
	// const simSelect = {
	// 	fileA: file_listA,
	// 	fileB: file_listB
	// }
	// console.log(file_listA);?
	// return simSelect;
}


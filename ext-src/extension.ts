/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable prefer-const */
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as JSONStream from 'jsonstream';
import { extractNode, copyGroup, noDupes, extractTxToDataframe, extractRxToDataframe, align, merge, half, assocRxTx } from "./extAlignFunctions";
import { analyse } from "./extVisualFunctions";
import { Problem } from './extTypes';
import { Message } from './messages/messageTypes';

export function activate(context: vscode.ExtensionContext) {

	const disposableSolve = vscode.commands.registerCommand(
		"unettrace.solve",
		async () => {
			initSolve(context);
		});
	
	const disposableSidePreview = vscode.commands.registerCommand(
		"unettrace.visual",
		async () => {
			initReactApp(context);
		});

  context.subscriptions.push(disposableSidePreview);
  context.subscriptions.push(disposableSolve);
}

async function initSolve(context: vscode.ExtensionContext) {
	let currentTextEditor: vscode.TextEditor | undefined =
		vscode.window.visibleTextEditors[0];

	const panel = vscode.window.createWebviewPanel(
		"liveHTMLPreviewer",
		"Unet: Align Traces",
		1,
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
	let filePath1: any;
	let filePath2: any;
	let ws: any;
	let probabilites : any = [];
	let delayInMilliseconds : number;
	let stdInMilliseconds : number;
	panel.webview.onDidReceiveMessage(
		async (message: Message) => {
			if (message.type === 'settings') {
			vscode.window.showInformationMessage("Select simulation from each trace");
			probabilites.push(message.payload.probDelay);
			probabilites.push(message.payload.probAssoc);
			probabilites.push(message.payload.probTrans);
			delayInMilliseconds = Number(message.payload.propDelay) * 1000;
			stdInMilliseconds = Number(message.payload.stdDev) * 1000;
			filePath1 = message.payload.file1;
			filePath2 = message.payload.file2;
			ws = path.parse(filePath1).dir;
			var streamA = fs.createReadStream(filePath1, { encoding: 'utf8' });
			var streamB = fs.createReadStream(filePath2, { encoding: 'utf8' });
			var parser = JSONStream.parse('events.*');
			var parser2 = JSONStream.parse('events.*');

			streamA.pipe(parser);
			const file_listA = await streamToSimArray(parser);
			streamB.pipe(parser2);
			const file_listB = await streamToSimArray(parser2);

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
				let txA: any[][];
				let rxA: any[][];
				let txB: any[][];
				let rxB: any[][];
				let exists = fs.existsSync(path.join(ws, "aligned"));
				if (exists === false) {
					fs.mkdirSync(path.join(ws, "aligned"));
				}
				const simA = message.payload.simA;
				const simB = message.payload.simB;
				var streamA = fs.createReadStream(filePath1, { encoding: 'utf8' });
				var parser = JSONStream.parse('events.*');
				var streamB = fs.createReadStream(filePath2, { encoding: 'utf8' });
				var parser2 = JSONStream.parse('events.*');
				streamA.pipe(parser);
				const dataA = await streamToDataArray(parser, simA);
				streamB.pipe(parser2);
				const dataB = await streamToDataArray(parser2, simB) as Array<{ [header: string]: any }>;
				

				let sender = extractNode(dataA as Array<{ [header: string]: any }>);
				copyGroup(dataA as Array<{ [header: string]: any }>, ws, path.parse(filePath1).base, simA);

				let receiver = extractNode(dataB as Array<{ [header: string]: any }>);
				txA = noDupes(extractTxToDataframe(receiver, dataA));
				rxB = noDupes(extractRxToDataframe(sender, dataB));

				let problem: Problem = {
					tx: txA,
					rx: rxB,
					mean: delayInMilliseconds,
					std: stdInMilliseconds,
					delay: (tx, rx) => probabilites[0],
					passoc: (tx, rx) => probabilites[1],
					pfalse: (rx) => probabilites[2]
				};

				let assocDataframe = assocRxTx(problem);
				let deltaT = 0;
				for (let row of assocDataframe) {
					deltaT += row[2];
				}
				deltaT = Math.floor(deltaT / assocDataframe.length);
				let clockDrift = deltaT - delayInMilliseconds;

				align(dataB, clockDrift, ws, path.parse(filePath2).base, simB);
				vscode.window.showInformationMessage(`Aligned trace.json timings found in ${path.join(ws, "aligned")}`);
				panel.webview.postMessage({
					command: "combine",
					payload: path.join(ws, "aligned")
				})
				
			} else if (message.type === 'combineFiles') {
				let mergePath = merge(message.payload);

				half(mergePath);
				vscode.window.showInformationMessage(`Combined file in ${path.join(ws, "aligned")}`);
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
				chunks.push(chunk.events)});
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

async function initReactApp(context: vscode.ExtensionContext) {
	let currentTextEditor: vscode.TextEditor | undefined =
    vscode.window.visibleTextEditors[0];
	
	const panel = vscode.window.createWebviewPanel(
		"liveHTMLPreviewer",
		"Unet: Trace Visualisation",
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
	
	let file = currentTextEditor.document.fileName;
	var stream = fs.createReadStream(file, { encoding: 'utf8' });
	var parser = JSONStream.parse('events.*');
	stream.pipe(parser);
	const simArray = await streamToSimArray(parser);
	console.log(simArray);

	panel.webview.postMessage({
		command: 'view',
		payload: simArray,
	});
	
	const onActiveEditorChange = vscode.window.onDidChangeActiveTextEditor(
		(editor) => {
			currentTextEditor = editor;
		}
	);
	
	const onTextChange = vscode.workspace.onDidChangeTextDocument(
		async (changeEvent) => {
			const file = changeEvent.document.fileName;
			var stream = fs.createReadStream(file, { encoding: 'utf8' });
			var parser = JSONStream.parse('events.*');
			stream.pipe(parser);
			const simArray = await streamToSimArray(parser);
			panel.webview.postMessage({
				command: 'view',
				payload: simArray,
			});
		}
	);

	panel.webview.onDidReceiveMessage(
		async (message: Message) => {
			if (message.type === 'selectedSIM') {
				const sim = message.payload
				var stream = fs.createReadStream(file, { encoding: 'utf8' });
				var parser = JSONStream.parse('events.*');
				stream.pipe(parser);
				const data = await streamToDataArray(parser, sim);
				const traceArray = analyse(data as Array<{ [header: string]: any }>);

				panel.webview.postMessage({
					command: "traceArray",
					payload: traceArray
				})
			}
		},
		undefined,
		context.subscriptions
	);

	function streamToSimArray (stream : any) {
		const chunks : any = [];
		return new Promise((resolve) => {
			stream.on('data', (chunk : any) => {
				chunks.push(chunk.group)
			});
			stream.on('end', () => resolve(chunks));
		})
	}
	
	function streamToDataArray (stream : any, sim : any) {
		const chunks : any = [];
		return new Promise((resolve) => {
			stream.on('data', (chunk : any) => {
				if (chunk.group === sim)
				chunks.push(chunk.events)});
			stream.on('end', () => resolve(chunks));
		})
	}

	panel.onDidDispose(() => {
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
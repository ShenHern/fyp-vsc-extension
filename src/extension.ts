// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworld" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworld.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from VSCode kuku!');
	});

	let disposable2 = vscode.commands.registerCommand('helloworld.helloBitch', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showWarningMessage('Sup\' Bitch!');
	});

	let disposable3 = vscode.commands.registerCommand('helloworld.openFileDialog', () => {
		// The code you place here will be executed every time your command is executed
		// open a file dialog box
		let ws = vscode.workspace.workspaceFolders;
		let rootPathStr = ".";
		if (ws) {
			rootPathStr = ws[0].toString();
		}
		let od: vscode.OpenDialogOptions = {canSelectFiles: true, canSelectFolders: false, defaultUri: vscode.Uri.file(rootPathStr)};
		let p1 = vscode.window.showOpenDialog(od);
		p1.then(
			(result) => {
				console.log(result);
				if (result !== undefined) {
					vscode.window.showInformationMessage(result[0].path);
				}
			});
		// vscode.window.showInformationMessage(myuri.path);
	});
	

	
	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}

// this method is called when your extension is deactivated
export function deactivate() {}

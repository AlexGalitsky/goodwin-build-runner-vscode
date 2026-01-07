import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "goodwin-build-runner" is now active!');

	const disposable = vscode.commands.registerCommand('goodwin-build-runner.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from goodwin-build-runner!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

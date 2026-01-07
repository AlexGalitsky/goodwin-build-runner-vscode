import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const config = vscode.workspace.getConfiguration('goodwinExtension');
        const enableFeatureA:boolean = config.get<boolean>('enableFeatureA') ?? false;
        const pathToExecutable:string = config.get<string>('pathToProjectRoot') ?? '';

	const disposableBuildAll = vscode.commands.registerCommand('goodwin-build-runner.buildAll', () => {
		const terminal = vscode.window.createTerminal("Мой Терминал");

		if (enableFeatureA) {
			terminal.sendText(`cd ${pathToExecutable}`);
        }

        terminal.sendText("dart run build_runner build --delete-conflicting-outputs");
        terminal.show();

        vscode.window.showInformationMessage('Ok, build all is done');
    });

	let disposableCurrentFile = vscode.commands.registerCommand('goodwin-build-runner.buildCurrentFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const filePath = document.uri.fsPath; // Полный путь к файлу
            // const fileName = document.fileName; // Тоже полный путь, но часто используется как синоним
            const relativePath = vscode.workspace.asRelativePath(document.uri); // Относительный путь
			let buildFilter = relativePath.replace('.dart', '.freezed.dart');

            console.log(`Полный путь: ${filePath}`); // Появится в Консоли отладки расширения
            vscode.window.showInformationMessage(`Путь к файлу: ${filePath}`); // Появится в UI
            vscode.window.showInformationMessage(`Относительный путь: ${relativePath}`);

			const terminal = vscode.window.createTerminal("Мой Терминал");

			if (enableFeatureA) {
				buildFilter = buildFilter.replace(pathToExecutable, '');
				terminal.sendText(`cd ${pathToExecutable}`);
			}

			terminal.sendText(`dart run build_runner build --delete-conflicting-outputs --build-filter=${buildFilter}`);
        	terminal.show();
        } else {
            vscode.window.showErrorMessage('Нет активного редактора!');
        }
    });

	context.subscriptions.push(disposableBuildAll);
	context.subscriptions.push(disposableCurrentFile);
}

export function deactivate() {}

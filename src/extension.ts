import * as vscode from 'vscode';
import childProc = require('child_process');
import { getDartProjectPath, COMMANDS, log, output, inferProgress } from './utils';

export function activate(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('goodwinExtension');
    const flutterIsNotRootFolder: boolean = config.get<boolean>('flutterIsNotRootFolder') ?? false;
    const pathToProjectRoot: string = config.get<string>('pathToProjectRoot') ?? '';

    const disposable1 = vscode.commands.registerCommand(COMMANDS.sayHello1, async () => {
        await buildRunnerBuild({ useFilters: true });
    });
    const disposable2 = vscode.commands.registerCommand(COMMANDS.sayHello2, () => {
        vscode.window.showInformationMessage('Ok, build all is done 2');
    });

    const disposableBuildAll = vscode.commands.registerCommand('goodwin-build-runner.buildAll', () => {
        const terminal = vscode.window.createTerminal("Мой Терминал");

        if (flutterIsNotRootFolder) {
            terminal.sendText(`cd ${pathToProjectRoot}`);
        }

        terminal.sendText("dart run build_runner build --delete-conflicting-outputs");
        terminal.show();

        vscode.window.showInformationMessage('Ok, build all is done');
    });

    const disposableCurrentFile = vscode.commands.registerCommand('goodwin-build-runner.buildCurrentFile', () => {
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

            if (flutterIsNotRootFolder) {
                buildFilter = buildFilter.replace(pathToProjectRoot, '');
                terminal.sendText(`cd ${pathToProjectRoot}`);
            }

            terminal.sendText(`dart run build_runner build --delete-conflicting-outputs --build-filter=${buildFilter}`);
            terminal.show();
        } else {
            vscode.window.showErrorMessage('Нет активного редактора!');
        }
    });

    context.subscriptions.push(disposableBuildAll);
    context.subscriptions.push(disposableCurrentFile);
    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
}

async function buildRunnerBuild(opt: { useFilters: boolean }) {
    const opts: vscode.ProgressOptions = { location: vscode.ProgressLocation.Notification };
    output.clear();
    const dartPath = getDartProjectPath();
    const cmd = "dart";
    let args: string[] = ["run", "build_runner", "build", "--delete-conflicting-outputs"];

    await vscode.window.withProgress(opts, async (p, _token) => {
        p.report({ message: "Starting build ..." });
        let progress = 0;
        let hasDoneSetup = false;
        await new Promise<void>(async (r) => {

            log(`Running \`${cmd} ${args.join(" ")}\``);
            log(`Current working folder: \`${dartPath}\`\n`);

            const child = childProc.spawn(
                cmd,
                args,
                { cwd: dartPath },
            );

            let mergedErr = "";
            let lastOut: string;

            child.stdout.on('data', (data) => {
                lastOut = data.toString();
                console.log('stdout: ' + lastOut);
                const prog = inferProgress(lastOut);
                let delta = prog === undefined ? undefined : prog - progress;
                if (prog !== undefined) {
                    if (!hasDoneSetup) {
                        hasDoneSetup = true;
                        if (delta !== undefined) { delta += 5; }
                    }
                    progress = prog;
                }
                p.report({ message: lastOut, increment: delta });
                output.append(lastOut);
            });

            child.stderr.on('data', (data) => {
                console.log('stderr: ' + data.toString());
                output.append(data.toString());
                mergedErr += data;
            });

            child.on("error", (err) => {
                console.error(err);
                output.append(err.toString());
                r();
            });

            child.on('close', async (code) => {
                console.log("close: " + code);
                r();

                if (code !== 0) {
                    let showError = true;

                    if (showError) {
                        output.show();
                        await vscode.window.showErrorMessage("Build failed. See output for details.");
                    }

                } else {
                    vscode.window.showInformationMessage(lastOut);
                }
            });
        });
    });

    vscode.window.showInformationMessage(dartPath ?? 'Unknown dart path');
}

export function deactivate() { }

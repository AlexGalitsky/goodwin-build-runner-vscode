import * as vscode from 'vscode';
import p = require('path');
import fs = require('fs');

export const output = vscode.window.createOutputChannel("Goodwin Build Runner");

export function getDartProjectPath(): string | undefined {
    // The code you place here will be executed every time your command is executed
    const document = vscode.window.activeTextEditor?.document;
    const uri = document?.uri;
    const path = uri?.path;

    console.log('document_path=' + path);

    const isWelcomeScreen = path === undefined;
    const isUntitled = document?.isUntitled;

    /// Guard against welcome screen
    /// Guard against untitled files
    if (isWelcomeScreen || isUntitled) {
        console.log(`isWelcomeScreen=${isWelcomeScreen}, isUntitled=${isUntitled}`);
        return undefined;
    }

    /// Guard against no workspace name
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri!);
    const workspaceName = workspaceFolder?.name;
    if (workspaceName !== undefined) { console.log(`workspaceName=${workspaceName}`); }

    /// Guard against no workspace path
    const workspacePath = workspaceFolder?.uri.path;
    if (workspacePath === undefined) {
        console.log("workspace has no path");
        return undefined;
    }

    console.log(`workspacePath=${workspacePath}`);

    const relativePath = path!.replace(workspacePath!, "");
    const segments = relativePath!.split("/").filter((e) => e !== "");
    segments.pop();

    console.log(`segments=${segments}`);

    const pubspecSuffix = 'pubspec.yaml';

    if (fs.existsSync(workspacePath! + pubspecSuffix)) { return workspacePath; }

    const walkSegments: string[] = [...segments];
    for (let i = walkSegments.length; i >= 0; i--) {
        const projectPath = vscode.Uri.file(p.join(workspacePath, ...walkSegments));
        const pubspec = vscode.Uri.joinPath(projectPath, pubspecSuffix);
        console.log('Looking for ' + pubspec.fsPath);
        if (fs.existsSync(pubspec.fsPath)) { console.log('Found it!'); return projectPath.fsPath; }
        walkSegments.pop();
    }
    return undefined;
}

export function log(s: any, show?: boolean) {
    console.log(s);
    // output.appendLine(s);
    // if (show === true) { output.show(); }
}

export function inferProgress(text: string): number | undefined {
    // match progress like: [INFO] 34.6s elapsed, 327/343 actions completed.
    const match = text.match(/(\d+)\s*\/\s*(\d+)\s+actions\s+completed/);
    if (match) {
        const [, completed, total] = match;
        return 100 * parseInt(completed) / parseInt(total);
    }
}

export const isWin32 = process.platform === "win32";
export const isLinux = process.platform === "linux";
const batchCommand = (cmd: string): string => isWin32 ? cmd + ".bat" : cmd;
const extensionID = "goodwin-build-runner";
export const COMMANDS = {
    sayHello1: `${extensionID}.sayHello1`,
    sayHello2: `${extensionID}.sayHello2`,
    buildAll: `${extensionID}.buildAll`,
    buildCurrentFile: `${extensionID}.buildCurrentFile`,
};
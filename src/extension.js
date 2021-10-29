const os = require('os');

const vscode = require('vscode');
const { restoreFile, hideHoverType } = require('./hoverTypeHider');

const defaultPath = os.platform() == 'win32'
    ? `${process.env.APPDATA}/Programs/Microsoft VS Code/resources/app/extensions/typescript-language-features/dist/extension.js`
    : '/usr/share/code/resources/app/extensions/typescript-language-features/dist/extension.js';

module.exports = {
    activate(context) {
        context.subscriptions.push(vscode.commands.registerCommand('icetbr.hoverTypeHider.enable', async () => {
            await hideHoverType(defaultPath);
            vscode.window.showInformationMessage('Hiver Type Hider enabled, reload window for the effects to take place');
        }));

        context.subscriptions.push(vscode.commands.registerCommand('icetbr.hoverTypeHider.disable', async () => {
            await restoreFile(defaultPath);
            vscode.window.showInformationMessage('Hiver Type Hider disabled, reload window for the effects to take place');
        }));
    },
};

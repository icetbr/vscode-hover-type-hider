const fs = require('fs');
const sudo = require('sudo-prompt');
const { promisify } = require('util');
const sudoExec = promisify(sudo.exec);
const os = require('os');
const path = require('path');

const copyFile = async (from, to, message) => {
  const copyCmd = os.platform() === 'win32' ? 'copy /Y' : 'cp'
  await sudoExec(`${copyCmd} ${from} ${to}`, { name: `VsCode Hover Type Hider ${message}` });
}

const replaceInFile = async (filePath, toReplaceRegex, replaceWithContent) => {
  const data = fs.readFileSync(filePath, 'utf8');
  const isAlreadyActivated = data.indexOf('e.displayString.replace') > -1;
  if (isAlreadyActivated) return;

  const replacedData = data.replace(toReplaceRegex, replaceWithContent);

  // writing to a temporary file and copying because multi-platform sed with lots of escaping is too complicated, and can't use `echo > ` to overrite file because the content is too large (`E2BIG` error)
  const tmpWritePath = path.join(os.tmpdir(), 'hoverTypeHiderTemp.js');
  fs.writeFileSync(tmpWritePath, replacedData, 'utf8');

  await copyFile(tmpWritePath, filePath, 'applying patch');
};

const backupFile = async (typescriptExtensionPath) => {
  if (fs.existsSync(`${typescriptExtensionPath}_bck`)) return;

  await copyFile(typescriptExtensionPath, `${typescriptExtensionPath}_bck`, 'backing up file');
};

const restoreFile = async (typescriptExtensionPath) => {
  if (!fs.existsSync(`${typescriptExtensionPath}_bck`)) return;

  await copyFile(`${typescriptExtensionPath}_bck`, typescriptExtensionPath, 'restoring file');
};

const getReplacements = () => {
  /*
    Replacing this

    File: extensions/typescript-language-features/out/languageFeatures/hover.js
    34:             if (source === typescriptService_1.ServerType.Syntax && this.client.capabilities.has(typescriptService_1.ClientCapability.Semantic)) {
    35:                 displayParts.push(versionProvider_1.localize({
    36:                     key: 'loadingPrefix',
    37:                     comment: ['Prefix displayed for hover entries while the server is still loading']
    38:                 }, "(loading...)"));
    39:             }
    40: 			displayParts.push(data.displayString);

    Could have changed here as well

    File: extensions/node_modules/typescript/lib/tsserver.js
    143494:         function getQuickInfoAtPosition(fileName, position) {

  */
  const toReplace = 't===s.ServerType.Syntax&&this.client.capabilities.has(s.ClientCapability.Semantic)&&r.push(i.localize({key:"loadingPrefix",comment:["Prefix displayed for hover entries while the server is still loading"]},"(loading...)")),r.push(e.displayString)';

  const typeRegex = /:[^,)]*/g; // contents: string
  const methodRegex = /^\(.*\)\s/; // (method)
  const anyRegex = /<.*>/gm; // Array<any>
  const functionExpressionRegex = /: \(/; //const a: (
  const arrayExpressionRegex = /:\s\(\{[^\{]*/gm; //const parts: ({
  const typeOfRegex = /:\stypeof[^,]*/g; //const vscode: typeof import("vscode")
  const functionExpressionEnd = /\s=>\s.*$/g; // => void

  // const replaceWith = `r.push(e.displayString.replace(/:[^,]*/g, '').replace(/<.*>/gm, '').replace(/^\(.*\)\s/, '') + ')'`
  const replaceWith = `r.push(e.displayString.replace(${typeOfRegex}, '').replace(${arrayExpressionRegex}, '').replace(${functionExpressionRegex}, '(').replace(${functionExpressionEnd}, '').replace(${methodRegex}, '').replace(${typeRegex}, '').replace(${anyRegex}, ''))`;
  return { toReplace, replaceWith };
};

module.exports = {
  restoreFile,
  getReplacements,

  async hideHoverType(typescriptExtensionPath) {
    await backupFile(typescriptExtensionPath);
    const { toReplace, replaceWith } = getReplacements();
    await replaceInFile(typescriptExtensionPath, toReplace, replaceWith);
    }
};
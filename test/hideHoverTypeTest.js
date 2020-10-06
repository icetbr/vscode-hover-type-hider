const assert = require('assert');
const fs = require('fs');
const { restoreFile, hideHoverType } = require('../src/hoverTypeHider');

const path = '/usr/share/code/resources/app/extensions/typescript-language-features/dist/extension.js';

const replacesExtensionFile = async () => {
    await restoreFile(path);
    const dataBefore = fs.readFileSync(path, 'utf8');
    assert.ok(dataBefore.indexOf('e.displayString.replace') === -1);

    await hideHoverType(path);
    const data = fs.readFileSync(path, 'utf8');
    assert.ok(data.indexOf('e.displayString.replace') > -1);

    await hideHoverType(path); // should not show another prompt

    await restoreFile(path);
};

const regexTest = () => {
    const sources = [
        `(method) constructor Array<any>(contents: string | MarkdownString | {
            language: string;
            value: string;
        } | MarkedString[], b: any, range?: Range): Hover`,

        `const parts: ({
            language: string;
            value: string;
        } | MarkdownString)[]`,

        'const a: (b: any, c: any) => void',
        'function d(e: any, f: any): void',
        'const displayParts: any[]',
        'const response: any',
        'any',
        '(parameter) position: any',
        'const vscode: typeof import("vscode")',
    ];
    const expecteds = [
        'constructor Array(contents, b, range?)',
        'const parts',
        'const a(b, c)',
        'function d(e, f)',
        'const displayParts',
        'const response',
        'any',
        'position',
        'const vscode',
    ];

    const typeRegex = /:[^,)]*/g; // contents: string
    const methodRegex = /^\(.*\)\s/; // (method)
    const anyRegex = /<.*>/gm; // Array<any>
    const functionExpressionRegex = /: \(/; //const a: (
    const arrayExpressionRegex = /:\s\(\{[^\{]*/gm; //const parts: ({
    const typeOfRegex = /:\stypeof[^,]*/g; //const vscode: typeof import("vscode")
    const functionExpressionEnd = /\s=>\s.*$/g; // => void

    for(let i = 0; i < sources.length; i++) {
        // assert.strictEqual(sources[i].replace(arrayExpressionRegex, '').replace(functionExpressionRegex, '(').replace(methodRegex, '').replace(typeRegex, '').replace(anyRegex, '') + ')', expecteds[i]);
        assert.strictEqual(sources[i].replace(typeOfRegex, '').replace(arrayExpressionRegex, '').replace(functionExpressionRegex, '(').replace(functionExpressionEnd, '').replace(methodRegex, '').replace(typeRegex, '').replace(anyRegex, ''), expecteds[i]);
    }
};

(async () => {
    try {
        regexTest();
        // await replacesExtensionFile();
        console.log('All tests OK')
        process.exit(0);
    } catch (e) {
        console.log(e);
        process.exit(1);
    }
})();


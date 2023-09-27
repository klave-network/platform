import { TransferListItem, Worker } from 'node:worker_threads';
import * as ts from 'typescript';
import { v4 as uuid } from 'uuid';
import { formatter } from './languageService';

const deferredMarker = '__klave_deferred__';

export class CompilerHost {

    id = uuid();
    entryFile = -1;

    constructor(private worker: Worker) { }

    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'exit', listener: (exitCode: number) => void): this;
    on(event: 'message', listener: (value: any) => void): this;
    on(event: 'messageerror', listener: (error: Error) => void): this;
    on(event: 'online', listener: () => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this {
        if (event === 'message') {
            this.worker.on('message', (message) => {
                if (message.type === 'write') {
                    if (message.filename === 'out.d.ts' && message.contents) {
                        let filteredDTS = '';
                        // parse the d.ts file
                        const sourceFile = ts.createSourceFile(
                            `${this.id}.d.ts`,
                            message.contents,
                            ts.ScriptTarget.Latest,
                            true
                        );
                        const seenFunctions: string[] = [];
                        ts.forEachChild(sourceFile, node => {
                            if (ts.isFunctionDeclaration(node)) {
                                if (node.name && ![
                                    'register_routes',
                                    '__new',
                                    '__pin',
                                    '__unpin',
                                    '__collect'
                                ].includes(node.name.text) && !seenFunctions.includes(node.name.text)) {
                                    if (node.name.text.startsWith(deferredMarker))
                                        seenFunctions.push(node.name.text.replace(deferredMarker, ''));
                                    filteredDTS += `${node.getFullText().replaceAll(deferredMarker, '').trim()}\n`;
                                }
                            }
                        });
                        message.contents = filteredDTS;
                    }
                    return listener(message);
                }
                if (message.type === 'read') {
                    if (message.filename === '..ts' ||
                        message.filename === 'index.ts' ||
                        message.filename === './index.ts' ||
                        message.filename === '.\\index.ts')
                        this.entryFile = message.id;
                }
                listener(message);
            });
        } else
            this.worker.on(event, listener);
        return this;
    }

    postMessage(value: any, transferList?: ReadonlyArray<TransferListItem>): void {
        if (value.type === 'read')
            if (value.id === this.entryFile && value.contents) {

                let normalizedEntryFile = `
                import { JSON as ${deferredMarker}JSON, Utils as ${deferredMarker}Utils } from '@klave/sdk';
                `;
                const sourceFile = ts.createSourceFile(
                    `${this.id}.d.ts`,
                    value.contents,
                    ts.ScriptTarget.Latest,
                    true
                );
                let shouldAddRouting = true;
                const exportedFunctions: Record<'transactions' | 'queries', string[]> = {
                    transactions: [],
                    queries: []
                };
                ts.forEachChild(sourceFile, node => {
                    if (ts.isFunctionDeclaration(node)) {
                        if (node.name?.text === 'register_routes') {
                            shouldAddRouting = false;
                            normalizedEntryFile += `${node.getFullText().trim()}\n`;
                        } else if (node.flags && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
                            if (node.name?.text) {
                                const tags = ts.getAllJSDocTagsOfKind(node, ts.SyntaxKind.JSDocTag);
                                const tagNames = new Set(tags.map(tag => tag.tagName.text));
                                if (tagNames.has('transaction'))
                                    exportedFunctions.transactions.push(node.name.text);
                                else if (tagNames.has('query'))
                                    exportedFunctions.queries.push(node.name.text);
                                const inputParam = node.parameters[0];
                                if (inputParam) {
                                    const inputParamName = inputParam.name.getText();
                                    const inputParamType = inputParam.type?.getText();
                                    if (inputParamType && inputParamType !== 'i32') {
                                        const mangledName = `${deferredMarker}${node.name.text}`;
                                        normalizedEntryFile += `${node.getFullText()
                                            // TODO - Understand if we should keep the export keyword
                                            // .replace('export function', 'function')
                                            .replace(node.name.text, mangledName)
                                            .trim()}\n`;
                                        normalizedEntryFile += `
                                        export function ${node.name.text}(${inputParamName}: i32): void {
                                            const ${inputParamName}String = ${deferredMarker}Utils.pointerToString(${inputParamName});
                                            const ${inputParamName}Object = ${deferredMarker}JSON.parse<${inputParamType}>(${inputParamName}String);
                                            return ${mangledName}(${inputParamName}Object);
                                        }`;
                                    } else {
                                        normalizedEntryFile += `${node.getFullText().trim()}\n`;
                                    }
                                } else {
                                    normalizedEntryFile += `${node.getFullText().trim()}\n`;
                                }
                            } else {
                                normalizedEntryFile += `${node.getFullText().trim()}\n`;
                            }
                        }
                    } else {
                        normalizedEntryFile += `${node.getFullText().trim()}\n`;
                    }
                });

                if (shouldAddRouting)
                    normalizedEntryFile += `
                    // @ts-ignore: decorator
                    @external("env", "add_user_query")
                    declare function runtime_add_user_query(s: ArrayBuffer): void;
                    // @ts-ignore: decorator
                    @external("env", "add_user_transaction")
                    declare function runtime_add_user_transaction(s: ArrayBuffer): void;
                    export function register_routes(): void {
                        ${exportedFunctions.queries.map(name => `runtime_add_user_query(String.UTF8.encode("${name}", true));`).join('\n')}
                        ${exportedFunctions.transactions.map(name => `runtime_add_user_transaction(String.UTF8.encode("${name}", true));`).join('\n')}
                    }
                `;

                normalizedEntryFile = formatter(normalizedEntryFile);
                value.contents = normalizedEntryFile;
            }
        this.worker.postMessage(value, transferList);
    }

    async terminate(): Promise<number> {
        return this.worker.terminate();
    }
}

export const createCompiler = async () => {

    const worker = new Worker(__dirname + '/compilerModule.mjs', {
        name: 'Klave WASM Compiler',
        env: {},
        argv: []
    });

    const compiler = new CompilerHost(worker);
    compiler.postMessage({ type: 'compile' });

    return compiler;
};

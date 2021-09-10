"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const data = __importStar(require("./api.json"));
function activate(context) {
    const provider1 = vscode.languages.registerCompletionItemProvider('lua', {
        provideCompletionItems(document, position, token, context) {
            const completionItems = [];
            for (const api_call in data.api_calls) {
                const completion = new vscode.CompletionItem(data.api_calls[api_call].name);
                completion.documentation = get_hover_str(data.api_calls[api_call].name, data.api_calls[api_call].params, data.api_calls[api_call].description);
                completion.kind = vscode.CompletionItemKind.Function;
                completionItems.push(completion);
            }
            return completionItems;
        }
    });
    const provider2 = vscode.languages.registerHoverProvider('lua', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);
            let markdown = new vscode.MarkdownString("");
            const result = data.api_calls.filter(x => x.name == word)[0];
            if (result != null) {
                markdown = get_hover_str(result.name, result.params, result.description);
            }
            return new vscode.Hover(markdown, new vscode.Range(position, position));
        }
    });
    const provider3 = vscode.languages.registerSignatureHelpProvider('lua', {
        provideSignatureHelp(document, position, token, context) {
            const { functionName, paramIndex } = parseFunction(document, position);
            const result = data.api_calls.filter(x => x.name == functionName);
            if (result.length > 0 && result[0].params.length > 0) {
                const sig = get_signature_str(result[0].name, result[0].params);
                const params = get_parameters_arr(result[0].params);
                return {
                    activeParameter: paramIndex,
                    activeSignature: 0,
                    signatures: [{
                            label: sig,
                            parameters: params
                        }]
                };
            }
            return;
        }
    }, "(", ",");
    context.subscriptions.push(provider1, provider2, provider3);
}
exports.activate = activate;
function get_parameters_arr(params) {
    const paramsArr = [];
    for (const param of params) {
        paramsArr.push({ label: param.name, documentation: param.documentation });
    }
    return paramsArr;
}
function get_signature_str(api_call, params) {
    let first = true;
    let signature = (api_call + "( ");
    for (const param of params) {
        if (first) {
            first = false;
        }
        else {
            signature += ", ";
        }
        signature += (param.type + " " + param.name);
    }
    signature += " )";
    return signature;
}
function get_hover_str(api_call, params, desc) {
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown('**' + api_call + "** \n");
    for (const param of params) {
        markdown.appendMarkdown("* " + param.name + ": " + param.type + "\n");
    }
    markdown.appendMarkdown("\n______________________________\n\n");
    markdown.appendMarkdown(desc);
    // Todo remove?
    markdown.isTrusted = true;
    return markdown;
}
function parseFunction(document, position) {
    let functionName = "";
    let paramIndex = 0;
    const range = new vscode.Range(new vscode.Position(position.line, 0), position);
    const text = document.getText(range);
    let bracketsDiffNumber = 0; // right bracket number - left bracket number, if bracketsDiffNumber === 0, present that is out of param inner scope
    for (let i = text.length - 1; i >= 0; i--) {
        const currentChar = text.charAt(i);
        if (currentChar === ',' && bracketsDiffNumber === 0) {
            paramIndex++;
        }
        else if (currentChar === '(' && bracketsDiffNumber === 0 && i > 0) {
            const wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, i - 1));
            if (wordRange !== undefined) {
                functionName = document.getText(wordRange);
                break;
            }
        }
        else if (currentChar === ')') {
            bracketsDiffNumber++;
        }
        else if (currentChar === '(') {
            bracketsDiffNumber--;
        }
    }
    return { functionName, paramIndex };
}
//# sourceMappingURL=extension.js.map
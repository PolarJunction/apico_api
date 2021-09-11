import * as vscode from 'vscode';
import * as data from './api.json';

export function activate(context: vscode.ExtensionContext) {

	const provider1 = vscode.languages.registerCompletionItemProvider(
		'lua',
		{
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext)
			{
				const completionItems = [];

				for (const api_call in data.api_calls)
				{
					const completion = new vscode.CompletionItem(data.api_calls[api_call].name);
					completion.documentation = get_hover_str(data.api_calls[api_call].name, data.api_calls[api_call].params, data.api_calls[api_call].description);
					completion.kind = vscode.CompletionItemKind.Function;

					completionItems.push(completion);
				}

				return completionItems;
			}
		});

	const provider2 = vscode.languages.registerHoverProvider(
		'lua',
		{
			provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken)
			{
				const range = document.getWordRangeAtPosition(position);
				const word = document.getText(range);
				let markdown = new vscode.MarkdownString("");

				const result = data.api_calls.filter( x => x.name == word)[0];

				if (result != null)
				{
					markdown = get_hover_str(result.name, result.params, result.description);
				}
				
				return new vscode.Hover(markdown, new vscode.Range(position, position));
			}
		});


	const provider3 = vscode.languages.registerSignatureHelpProvider(
		'lua',
		{
			provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.SignatureHelpContext)
			{
				const {functionName, paramIndex} = parseFunction(document, position);
				const result = data.api_calls.filter( x => x.name == functionName);

				if (result.length > 0 && result[0].params.length > 0)
				{
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
		},
		"(", ","
	);


	context.subscriptions.push(provider1, provider2, provider3);
}

/* Create a ParamaterInformation array from the api call */
function get_parameters_arr(params: any[]): vscode.ParameterInformation[]
{
	const paramsArr = [];

	for (const param of params)
	{
		paramsArr.push({ label: param.name, documentation: param.documentation});
	}

	return paramsArr;
}

/* Format the string output for the function signature */
function get_signature_str(api_call: string, params: any[]): string
{
	let first = true;
	let signature = (api_call + "( ");


	for (const param of params)
	{
		if (first)
		{
			first = false;
		}
		else
		{
			signature += ", ";
		}

		signature += (param.type + " " + param.name);
	}

	signature += " )";

	return signature;
}

/* Format the markdown string output for the hover tooltip, using the api info */
function get_hover_str(api_call: string, params: any[], desc: string ): vscode.MarkdownString
{
	const markdown = new vscode.MarkdownString();

	markdown.appendMarkdown('**' + api_call + "** \n");
	
	for (const param of params) 
	{
		markdown.appendMarkdown("* " + param.name + ": " + param.type + "\n");
	}

	markdown.appendMarkdown("\n______________________________\n\n");
	markdown.appendMarkdown(desc);

	// Todo remove?
	markdown.isTrusted = true;

	return markdown;
}

/* Used to assist with signature help, gets the current parameter using ',' trigger chars and provides the current function name */
function parseFunction(document: vscode.TextDocument, position: vscode.Position): { functionName: string, paramIndex: number }
{
	let functionName = "";
	let paramIndex = 0;

	const range: vscode.Range = new vscode.Range(new vscode.Position(position.line, 0), position);
	const text: string = document.getText(range);

	let bracketsDiffNumber = 0;  // right bracket number - left bracket number, if bracketsDiffNumber === 0, present that is out of param inner scope

	for (let i = text.length - 1; i >= 0; i--)
	{
		const currentChar: string = text.charAt(i);
		if (currentChar === ',' && bracketsDiffNumber === 0)
		{
			paramIndex++;
		} else if (currentChar === '(' && bracketsDiffNumber === 0 && i > 0)
		{
			const wordRange = document.getWordRangeAtPosition(new vscode.Position(position.line, i - 1));
			if (wordRange !== undefined)
			{
				functionName = document.getText(wordRange);
				break;
			}
		} else if (currentChar === ')')
		{
			bracketsDiffNumber++;
		} else if (currentChar === '(')
		{
			bracketsDiffNumber--;
		}
	}

	return { functionName, paramIndex };
}

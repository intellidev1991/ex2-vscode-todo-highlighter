import * as vscode from "vscode";
import { Parser } from "./parser";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, extension "ht-todo-highlighter" is now activated!');

  // Global Variables
  let activeEditor: vscode.TextEditor;
  let timeout: NodeJS.Timer; //timer as debounce for 250ms to avoid calling too fast
  let debounce_caller: number = 250; //ms
  let parser: Parser = new Parser();

  // Called to handle events below
  let formatter = function (useHash = false) {
    // if no active window is open, return
    if (!activeEditor) return;

    // if language isn't supported, return
    if (!parser.supportedLanguage) return;

    // Finds the single line comments using the language comment delimiter
    parser.FindSingleLineComments(activeEditor);

    // Apply the styles set in the package.json
    parser.ApplyDecorations(activeEditor);
  };

  const triggerUpdateFormatter = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(formatter, debounce_caller);
  };

  // Get the active editor for the first time
  if (vscode.window.activeTextEditor) {
    activeEditor = vscode.window.activeTextEditor;
    console.log("--==>> Get the active editor for the first time ");

    // Set the regex patterns for the specified language's comments
    parser.SetRegex(activeEditor.document.languageId);

    // Trigger first update of decorators
    triggerUpdateFormatter();
  }

  // Subscription to handle active file changed
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      if (editor) {
        activeEditor = editor;
        console.log("--==>> onDidChangeActiveTextEditor ");
        console.log("--==>> languageId :", editor.document.languageId);

        // Set regex for updated language
        parser.SetRegex(editor.document.languageId);

        // Trigger update to set decorations for newly active file
        triggerUpdateFormatter();
      }
    },
    null,
    context.subscriptions,
  );

  // Subscription to handle file contents changed (Typing in the text editor)
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      // Trigger updates if the text was changed in the same document
      if (activeEditor && event.document === activeEditor.document) {
        console.log("--==>> onDidChangeTextDocument ");

        triggerUpdateFormatter();
      }
    },
    null,
    context.subscriptions,
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

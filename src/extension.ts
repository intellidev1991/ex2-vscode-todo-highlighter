import * as vscode from "vscode";
import { Parser } from "./parser";

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, extension "ht-todo-highlighter" is now activated!');

  // Global Variables
  let activeTextEditor: vscode.TextEditor;
  let timeout: NodeJS.Timer; //timer as debounce for 250ms to avoid calling too fast
  let debounce_caller: number = 250; //ms
  let parser: Parser = new Parser();

  // Called to handle events below
  const formatter = () => {
    // if no active window is open, return
    if (!activeTextEditor) return;

    // if language isn't supported, return
    if (!parser.isLanguageSupported()) return;

    // Finds the single line comments using the language comment delimiter
    parser.FindSingleLineComments(activeTextEditor);

    // Apply the styles set in the package.json
    parser.ApplyDecorations(activeTextEditor);
  };

  const triggerUpdateFormatter = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(formatter, debounce_caller);
  };

  const triggerWhenLanguageIdChanged = (languageId: string) => {
    // Set the regex patterns for the specified language's comments
    parser.setRegexPatternsByLanguageId(languageId);

    // Trigger first update of decorators
    triggerUpdateFormatter();
  };

  // Get the active editor for the first time
  if (vscode.window.activeTextEditor) {
    activeTextEditor = vscode.window.activeTextEditor;
    console.log("--==>> Get the active editor for the first time ");
    triggerWhenLanguageIdChanged(activeTextEditor.document.languageId);
  }

  // Subscription to handle active file changed
  vscode.window.onDidChangeActiveTextEditor(
    (textEditor) => {
      if (textEditor) {
        activeTextEditor = textEditor;
        // Trigger updates when the active tab document changed
        console.log("--==>> Active-File changed, LanguageId is:", textEditor.document.languageId);
        triggerWhenLanguageIdChanged(textEditor.document.languageId);
      }
    },
    null,
    context.subscriptions,
  );

  // Subscription to handle file contents changed (Typing in the text editor)
  vscode.workspace.onDidChangeTextDocument(
    (e) => {
      // Trigger updates if the text was changed in the same document
      if (activeTextEditor && e.document === activeTextEditor.document) {
        console.log("--==>> Typing... ");

        triggerUpdateFormatter();
      }
    },
    null,
    context.subscriptions,
  );

  // Subscription to handle when language id for the active file changed.
  vscode.workspace.onDidOpenTextDocument(
    (e) => {
      // When the language of a document changes the onDidCloseTextDocument and onDidOpenTextDocument events are fired:
      console.log("--==>> LanguageId changed, LanguageId is:" + e.languageId);
      triggerWhenLanguageIdChanged(e.languageId);
    },
    null,
    context.subscriptions,
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}

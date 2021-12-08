/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Parser = void 0;
const vscode = __webpack_require__(1);
class Parser {
    constructor() {
        this.tags = [];
        this.expression = "";
        this.delimiter = "";
        this.blockCommentStart = "";
        this.blockCommentEnd = "";
        this.highlightSingleLineComments = true;
        this.highlightMultilineComments = false;
        this.highlightJSDoc = false;
        // * this will allow plaintext files to show comment highlighting if switched on
        this.isPlainText = false;
        // * this is used to prevent the first line of the file (specifically python) from coloring like other comments
        this.ignoreFirstLine = false;
        // * this is used to trigger the events when a supported language code is found
        this.supportedLanguage = true;
        // Read from the package.json
        this.contributions = vscode.workspace.getConfiguration("todo-highlighter");
        this.setTags();
    }
    /**
     * Sets the regex to be used by the matcher based on the config specified in the package.json
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    SetRegex(languageCode) {
        this.setDelimiter(languageCode);
        // if the language isn't supported, we don't need to go any further
        if (!this.supportedLanguage) {
            return;
        }
        let characters = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }
        if (this.isPlainText && this.contributions.highlightPlainText) {
            // start by tying the regex to the first character in a line
            this.expression = "(^)+([ \\t]*[ \\t]*)";
        }
        else {
            // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
            this.expression = "(" + this.delimiter.replace(/\//gi, "\\/") + ")+( |\t)*";
        }
        // Apply all configurable comment start tags
        this.expression += "(";
        this.expression += characters.join("|");
        this.expression += ")+(.*)";
    }
    /**
     * Finds all single line comments delimited by a given delimiter and matching tags specified in package.json
     * @param activeEditor The active text editor containing the code document
     */
    FindSingleLineComments(activeEditor) {
        // If highlight single line comments is off, single line comments are not supported for this language
        if (!this.highlightSingleLineComments)
            return;
        let text = activeEditor.document.getText();
        // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
        let regexFlags = this.isPlainText ? "igm" : "ig";
        let regEx = new RegExp(this.expression, regexFlags);
        let match;
        while ((match = regEx.exec(text))) {
            let startPos = activeEditor.document.positionAt(match.index);
            let endPos = activeEditor.document.positionAt(match.index + match[0].length);
            let range = { range: new vscode.Range(startPos, endPos) };
            // Required to ignore the first line of .py files (#61)
            if (this.ignoreFirstLine && startPos.line === 0 && startPos.character === 0) {
                continue;
            }
            // Find which custom delimiter was used in order to add it to the collection
            let matchTag = this.tags.find((item) => item.tag.toLowerCase() === match[3].toLowerCase());
            if (matchTag) {
                matchTag.ranges.push(range);
            }
        }
    }
    /**
     * Finds block comments as indicated by start and end delimiter
     * @param activeEditor The active text editor containing the code document
     */
    FindBlockComments(activeEditor) {
        // If highlight multiline is off in package.json or doesn't apply to his language, return
        if (!this.highlightMultilineComments)
            return;
        let text = activeEditor.document.getText();
        // Build up regex matcher for custom delimiter tags
        let characters = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }
        // Combine custom delimiters and the rest of the comment block matcher
        let commentMatchString = "(^)+([ \\t]*[ \\t]*)(";
        commentMatchString += characters.join("|");
        commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";
        // Use start and end delimiters to find block comments
        let regexString = "(^|[ \\t])(";
        regexString += this.blockCommentStart;
        regexString += "[\\s])+([\\s\\S]*?)(";
        regexString += this.blockCommentEnd;
        regexString += ")";
        let regEx = new RegExp(regexString, "gm");
        let commentRegEx = new RegExp(commentMatchString, "igm");
        // Find the multiline comment block
        let match;
        while ((match = regEx.exec(text))) {
            let commentBlock = match[0];
            // Find the line
            let line;
            while ((line = commentRegEx.exec(commentBlock))) {
                let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
                let range = { range: new vscode.Range(startPos, endPos) };
                // Find which custom delimiter was used in order to add it to the collection
                let matchString = line[3];
                let matchTag = this.tags.find((item) => item.tag.toLowerCase() === matchString.toLowerCase());
                if (matchTag) {
                    matchTag.ranges.push(range);
                }
            }
        }
    }
    /**
     * Finds all multiline comments starting with "*"
     * @param activeEditor The active text editor containing the code document
     */
    FindJSDocComments(activeEditor) {
        // If highlight multiline is off in package.json or doesn't apply to his language, return
        if (!this.highlightMultilineComments && !this.highlightJSDoc)
            return;
        let text = activeEditor.document.getText();
        // Build up regex matcher for custom delimiter tags
        let characters = [];
        for (let commentTag of this.tags) {
            characters.push(commentTag.escapedTag);
        }
        // Combine custom delimiters and the rest of the comment block matcher
        let commentMatchString = "(^)+([ \\t]*\\*[ \\t]*)("; // Highlight after leading *
        let regEx = /(^|[ \t])(\/\*\*)+([\s\S]*?)(\*\/)/gm; // Find rows of comments matching pattern /** */
        commentMatchString += characters.join("|");
        commentMatchString += ")([ ]*|[:])+([^*/][^\\r\\n]*)";
        let commentRegEx = new RegExp(commentMatchString, "igm");
        // Find the multiline comment block
        let match;
        while ((match = regEx.exec(text))) {
            let commentBlock = match[0];
            // Find the line
            let line;
            while ((line = commentRegEx.exec(commentBlock))) {
                let startPos = activeEditor.document.positionAt(match.index + line.index + line[2].length);
                let endPos = activeEditor.document.positionAt(match.index + line.index + line[0].length);
                let range = { range: new vscode.Range(startPos, endPos) };
                // Find which custom delimiter was used in order to add it to the collection
                let matchString = line[3];
                let matchTag = this.tags.find((item) => item.tag.toLowerCase() === matchString.toLowerCase());
                if (matchTag) {
                    matchTag.ranges.push(range);
                }
            }
        }
    }
    /**
     * Apply decorations after finding all relevant comments
     * @param activeEditor The active text editor containing the code document
     */
    ApplyDecorations(activeEditor) {
        for (let tag of this.tags) {
            activeEditor.setDecorations(tag.decoration, tag.ranges);
            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }
    /**
     * Sets the comment delimiter [//, #, --, '] of a given language
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    setDelimiter(languageCode) {
        this.supportedLanguage = true;
        this.ignoreFirstLine = false;
        this.isPlainText = false;
        switch (languageCode) {
            case "asciidoc":
                this.setCommentFormat("//", "////", "////");
                break;
            case "apex":
            case "javascript":
            case "javascriptreact":
            case "typescript":
            case "typescriptreact":
                this.setCommentFormat("//", "/*", "*/");
                this.highlightJSDoc = true;
                break;
            case "al":
            case "c":
            case "cpp":
            case "csharp":
            case "dart":
            case "flax":
            case "fsharp":
            case "go":
            case "groovy":
            case "haxe":
            case "java":
            case "jsonc":
            case "kotlin":
            case "less":
            case "pascal":
            case "objectpascal":
            case "php":
            case "rust":
            case "scala":
            case "sass":
            case "scss":
            case "shaderlab":
            case "stylus":
            case "swift":
            case "verilog":
            case "vue":
                this.setCommentFormat("//", "/*", "*/");
                break;
            case "css":
                this.setCommentFormat("/*", "/*", "*/");
                break;
            case "coffeescript":
            case "dockerfile":
            case "gdscript":
            case "graphql":
            case "julia":
            case "makefile":
            case "perl":
            case "perl6":
            case "puppet":
            case "r":
            case "ruby":
            case "shellscript":
            case "tcl":
            case "yaml":
                this.delimiter = "#";
                break;
            case "tcl":
                this.delimiter = "#";
                this.ignoreFirstLine = true;
                break;
            case "elixir":
            case "python":
                this.setCommentFormat("#", '"""', '"""');
                this.ignoreFirstLine = true;
                break;
            case "nim":
                this.setCommentFormat("#", "#[", "]#");
                break;
            case "powershell":
                this.setCommentFormat("#", "<#", "#>");
                break;
            case "ada":
            case "hive-sql":
            case "pig":
            case "plsql":
            case "sql":
                this.delimiter = "--";
                break;
            case "lua":
                this.setCommentFormat("--", "--[[", "]]");
                break;
            case "elm":
            case "haskell":
                this.setCommentFormat("--", "{-", "-}");
                break;
            case "brightscript":
            case "diagram": // ? PlantUML is recognized as Diagram (diagram)
            case "vb":
                this.delimiter = "'";
                break;
            case "bibtex":
            case "erlang":
            case "latex":
            case "matlab":
                this.delimiter = "%";
                break;
            case "clojure":
            case "racket":
            case "lisp":
                this.delimiter = ";";
                break;
            case "terraform":
                this.setCommentFormat("#", "/*", "*/");
                break;
            case "COBOL":
                this.delimiter = this.escapeRegExp("*>");
                break;
            case "fortran-modern":
                this.delimiter = "c";
                break;
            case "SAS":
            case "stata":
                this.setCommentFormat("*", "/*", "*/");
                break;
            case "html":
            case "markdown":
            case "xml":
                this.setCommentFormat("<!--", "<!--", "-->");
                break;
            case "twig":
                this.setCommentFormat("{#", "{#", "#}");
                break;
            case "genstat":
                this.setCommentFormat("\\", '"', '"');
                break;
            case "cfml":
                this.setCommentFormat("<!---", "<!---", "--->");
                break;
            case "plaintext":
                this.isPlainText = true;
                // If highlight plaintext is enabeld, this is a supported language
                this.supportedLanguage = this.contributions.highlightPlainText;
                break;
            default:
                this.supportedLanguage = false;
                break;
        }
    }
    /**
     * Sets the highlighting tags up for use by the parser
     */
    setTags() {
        let items = this.contributions.tags;
        for (let item of items) {
            let options = { color: item.color, backgroundColor: item.backgroundColor };
            // ? the textDecoration is initialised to empty so we can concat a preceeding space on it
            options.textDecoration = "";
            if (item.strikethrough) {
                options.textDecoration += "line-through";
            }
            if (item.underline) {
                options.textDecoration += " underline";
            }
            if (item.bold) {
                options.fontWeight = "bold";
            }
            if (item.italic) {
                options.fontStyle = "italic";
            }
            let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, "\\$1");
            this.tags.push({
                tag: item.tag,
                escapedTag: escapedSequence.replace(/\//gi, "\\/"),
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(options),
            });
        }
    }
    /**
     * Escapes a given string for use in a regular expression
     * @param input The input string to be escaped
     * @returns {string} The escaped string
     */
    escapeRegExp(input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }
    /**
     * Set up the comment format for single and multiline highlighting
     * @param singleLine The single line comment delimiter. If NULL, single line is not supported
     * @param start The start delimiter for block comments
     * @param end The end delimiter for block comments
     */
    setCommentFormat(singleLine, start, end) {
        // If no single line comment delimiter is passed, single line comments are not supported
        if (singleLine) {
            this.delimiter = this.escapeRegExp(singleLine);
        }
        else {
            this.highlightSingleLineComments = false;
        }
        this.blockCommentStart = this.escapeRegExp(start);
        this.blockCommentEnd = this.escapeRegExp(end);
        this.highlightMultilineComments = this.contributions.multilineComments;
    }
}
exports.Parser = Parser;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __webpack_require__(1);
const parser_1 = __webpack_require__(2);
// this method is called when vs code is activated
function activate(context) {
    console.log('Congratulations, extension "ht-todo-highlighter" is now activated!');
    // Global Variables
    let activeEditor;
    let timeout; //timer as debounce for 250ms to avoid calling too fast
    let debounce_caller = 250; //ms
    let parser = new parser_1.Parser();
    // Called to handle events below
    let formatter = function (useHash = false) {
        // * if no active window is open, return
        if (!activeEditor)
            return;
        // * if lanugage isn't supported, return
        if (!parser.supportedLanguage)
            return;
        // Finds the single line comments using the language comment delimiter
        parser.FindSingleLineComments(activeEditor);
        // Finds the multi line comments using the language comment delimiter
        parser.FindBlockComments(activeEditor);
        // Finds the jsdoc comments
        parser.FindJSDocComments(activeEditor);
        // Apply the styles set in the package.json
        parser.ApplyDecorations(activeEditor);
    };
    const triggerUpdateFormatter = () => {
        if (timeout)
            clearTimeout(timeout);
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
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            activeEditor = editor;
            console.log("--==>> onDidChangeActiveTextEditor ");
            // Set regex for updated language
            parser.SetRegex(editor.document.languageId);
            // Trigger update to set decorations for newly active file
            triggerUpdateFormatter();
        }
    }, null, context.subscriptions);
    // Subscription to handle file contents changed (Typing in the text editor)
    vscode.workspace.onDidChangeTextDocument((event) => {
        // Trigger updates if the text was changed in the same document
        if (activeEditor && event.document === activeEditor.document) {
            console.log("--==>> onDidChangeTextDocument ");
            triggerUpdateFormatter();
        }
    }, null, context.subscriptions);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map
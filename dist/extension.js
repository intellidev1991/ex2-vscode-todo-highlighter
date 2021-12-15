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
const TagDecoration_1 = __webpack_require__(3);
class Parser {
    constructor() {
        this.tags = [];
        this.expression = ""; //Regular Expression
        this.delimiter = "";
        this.supportedLanguage = true;
        this.initializeTagsSearch();
    }
    isLanguageSupported() {
        return this.supportedLanguage;
    }
    /**
     * Sets the highlighting tags up for use by the parser
     */
    initializeTagsSearch() {
        let items = TagDecoration_1.tagsDecorationData;
        for (let item of items) {
            let options = { color: item.color, backgroundColor: item.backgroundColor };
            // the textDecoration is initialized to empty
            options.textDecoration = "";
            if (item.strikethrough)
                options.textDecoration += "line-through";
            if (item.underline)
                options.textDecoration += " underline";
            if (item.bold)
                options.fontWeight = "bold";
            if (item.italic)
                options.fontStyle = "italic";
            this.tags.push({
                tag: item.tag,
                ranges: [],
                decoration: vscode.window.createTextEditorDecorationType(options),
            });
        }
    }
    /**
     * Sets the regex to be used by the matcher based on the config specified in the package.json
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    setRegexPatternsByLanguageId(languageCode) {
        this.setDetectCommentFormat(languageCode);
        // if the language does not supported, in the setDetectCommentFormat method; return
        if (!this.supportedLanguage) {
            return;
        }
        // Collect all starting tags
        let start_tags_array = [];
        let start_tags = "";
        for (let item of this.tags) {
            start_tags_array.push(item.tag);
        }
        //the | will be used in regex as OR operator. e.g =>  todo|!tip|important
        start_tags = start_tags_array.join("|");
        // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
        // convert // into => \/\/  using (/\//gi, "\\/")  so each / will turn into \/ => the escaped-char will start with \
        // Global pattern flags:
        // g modifier: global. All matches (don't return after first match)
        // i modifier: insensitive. Case insensitive match (ignores case of [a-zA-Z])
        // + matches the previous token between one and unlimited times, as many times as possible, giving back as needed (greedy)
        // * matches the previous token between zero and unlimited times, as many times as possible, giving back as needed (greedy)
        // Use the https://regex101.com/  for more info
        this.expression = "(" + this.delimiter.replace(/\//gi, "\\/") + ")+( |\t)*";
        // Apply all configurable comment start tags
        this.expression += "(";
        this.expression += start_tags;
        this.expression += ")+(.*)";
        console.log("start_tags=> ", start_tags);
        console.log("regular expression pattern=> ", this.expression);
    }
    //=================== Detect language & comment format ===================
    /**
     * Sets the comment delimiter [//, #, --, '] of a given language
     * @param languageCode The short code of the current language
     * https://code.visualstudio.com/docs/languages/identifiers
     */
    setDetectCommentFormat(languageCode) {
        this.supportedLanguage = true;
        switch (languageCode) {
            case "javascript":
            case "javascriptreact":
            case "typescript":
            case "typescriptreact":
                this.setCommentFormat("//");
                break;
            case "html":
            case "markdown":
            case "xml":
                this.setCommentFormat("<!--");
                break;
            default:
                // If the delimiter does not found then set the supported language to false
                this.supportedLanguage = false;
                break;
        }
    }
    /**
     * Set up the comment format
     * @param singleLineDetectorSign The single line comment delimiter. If NULL, single line is not supported
     */
    setCommentFormat(singleLineDetectorSign) {
        if (singleLineDetectorSign)
            this.delimiter = singleLineDetectorSign;
        else {
        }
    }
    //=================== Find comments ===================
    /**
     * Finds all single line comments delimited by a given delimiter and matching tags specified in tagsDecorationData
     * @param activeTextEditor The active text editor containing the code document
     */
    FindSingleLineComments(activeTextEditor) {
        // Fetch all text from the active text editor
        let text = activeTextEditor.document.getText();
        // Global pattern flags:
        // g modifier: global. All matches (don't return after first match)
        // i modifier: insensitive. Case insensitive match (ignores case of [a-zA-Z])
        let regexFlags = "ig";
        let regEx = new RegExp(this.expression, regexFlags);
        let match;
        while ((match = regEx.exec(text))) {
            let startPos = activeTextEditor.document.positionAt(match.index);
            let endPos = activeTextEditor.document.positionAt(match.index + match[0].length);
            let range = { range: new vscode.Range(startPos, endPos) };
            console.log("match", match);
            // Find which custom delimiter was used in order to add it to the collection
            let matchTag = this.tags.find((item) => item.tag.toLowerCase() === match[3].toLowerCase());
            if (matchTag) {
                matchTag.ranges.push(range);
            }
        }
    }
    //=================== Apply decorations ===================
    /**
     * Apply decorations after finding all relevant comments
     * @param activeTextEditor The active text editor containing the code document
     */
    ApplyDecorations(activeTextEditor) {
        for (let tag of this.tags) {
            activeTextEditor.setDecorations(tag.decoration, tag.ranges);
            // clear the ranges for the next pass
            tag.ranges.length = 0;
        }
    }
}
exports.Parser = Parser;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.tagsDecorationData = void 0;
//Add any tags that you want to find in the text and change the style of them right after comment. (e.g: //todo  //tip)
exports.tagsDecorationData = [
    {
        tag: "todo:",
        color: "#e1107e",
        strikethrough: false,
        underline: false,
        backgroundColor: "transparent",
        bold: false,
        italic: false,
    },
    {
        tag: "tip",
        color: "#f4dc77",
        strikethrough: false,
        underline: false,
        backgroundColor: "transparent",
        bold: true,
        italic: false,
    },
    {
        tag: "important",
        color: "#fefefe",
        strikethrough: false,
        underline: false,
        backgroundColor: "#4274fd",
        bold: false,
        italic: true,
    },
    {
        tag: "data",
        color: "#00ff00",
        strikethrough: false,
        underline: true,
        backgroundColor: "#4274fd",
        bold: true,
        italic: true,
    },
];


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
    let activeTextEditor;
    let timeout; //timer as debounce for 250ms to avoid calling too fast
    let debounce_caller = 250; //ms
    let parser = new parser_1.Parser();
    // Called to handle events below
    const formatter = () => {
        // if no active window is open, return
        if (!activeTextEditor)
            return;
        // if language isn't supported, return
        if (!parser.isLanguageSupported())
            return;
        // Finds the single line comments using the language comment delimiter
        parser.FindSingleLineComments(activeTextEditor);
        // Apply the styles set in the package.json
        parser.ApplyDecorations(activeTextEditor);
    };
    const triggerUpdateFormatter = () => {
        if (timeout)
            clearTimeout(timeout);
        timeout = setTimeout(formatter, debounce_caller);
    };
    const triggerWhenLanguageIdChanged = (languageId) => {
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
    vscode.window.onDidChangeActiveTextEditor((textEditor) => {
        if (textEditor) {
            activeTextEditor = textEditor;
            // Trigger updates when the active tab document changed
            console.log("--==>> Active-File changed, LanguageId is:", textEditor.document.languageId);
            triggerWhenLanguageIdChanged(textEditor.document.languageId);
        }
    }, null, context.subscriptions);
    // Subscription to handle file contents changed (Typing in the text editor)
    vscode.workspace.onDidChangeTextDocument((e) => {
        // Trigger updates if the text was changed in the same document
        if (activeTextEditor && e.document === activeTextEditor.document) {
            console.log("--==>> Typing... ");
            triggerUpdateFormatter();
        }
    }, null, context.subscriptions);
    // Subscription to handle when language id for the active file changed.
    vscode.workspace.onDidOpenTextDocument((e) => {
        // When the language of a document changes the onDidCloseTextDocument and onDidOpenTextDocument events are fired:
        console.log("--==>> LanguageId changed, LanguageId is:" + e.languageId);
        triggerWhenLanguageIdChanged(e.languageId);
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
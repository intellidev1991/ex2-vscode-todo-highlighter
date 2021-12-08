import * as vscode from "vscode";

interface CommentTag {
  tag: string;
  escapedTag: string;
  decoration: vscode.TextEditorDecorationType;
  ranges: Array<vscode.DecorationOptions>;
}

interface ITag {
  tag: string;
  color: string;
  strikethrough: boolean;
  underline: boolean;
  bold: boolean;
  italic: boolean;
  backgroundColor: string;
}

const default_tags: ITag[] = [
  {
    tag: "todo",
    color: "#FF8C00",
    strikethrough: false,
    underline: false,
    backgroundColor: "transparent",
    bold: false,
    italic: false,
  },
];
export class Parser {
  private tags: CommentTag[] = [];
  private expression: string = "";

  private delimiter: string = "";
  private blockCommentStart: string = "";
  private blockCommentEnd: string = "";

  //  this is used to trigger the events when a supported language code is found
  public supportedLanguage = true;

  public constructor() {
    this.setTagsSearch();
  }

  /**
   * Sets the regex to be used by the matcher based on the config specified in the package.json
   * @param languageCode The short code of the current language
   * https://code.visualstudio.com/docs/languages/identifiers
   */
  public SetRegex(languageCode: string) {
    this.setDelimiter(languageCode);

    // if the language isn't supported, we don't need to go any further
    if (!this.supportedLanguage) {
      return;
    }

    let characters: Array<string> = [];
    for (let commentTag of this.tags) {
      characters.push(commentTag.escapedTag);
    }

    // start by finding the delimiter (//, --, #, ') with optional spaces or tabs
    this.expression = "(" + this.delimiter.replace(/\//gi, "\\/") + ")+( |\t)*";

    // Apply all configurable comment start tags
    this.expression += "(";
    this.expression += characters.join("|");
    this.expression += ")+(.*)";
  }

  /**
   * Finds all single line comments delimited by a given delimiter and matching tags specified in package.json
   * @param activeEditor The active text editor containing the code document
   */
  public FindSingleLineComments(activeEditor: vscode.TextEditor): void {
    let text = activeEditor.document.getText();

    // if it's plain text, we have to do mutliline regex to catch the start of the line with ^
    let regexFlags = "ig";
    let regEx = new RegExp(this.expression, regexFlags);

    let match: any;
    while ((match = regEx.exec(text))) {
      let startPos = activeEditor.document.positionAt(match.index);
      let endPos = activeEditor.document.positionAt(match.index + match[0].length);
      let range = { range: new vscode.Range(startPos, endPos) };

      // Find which custom delimiter was used in order to add it to the collection
      let matchTag = this.tags.find((item) => item.tag.toLowerCase() === match[3].toLowerCase());

      if (matchTag) {
        matchTag.ranges.push(range);
      }
    }
  }

  /**
   * Apply decorations after finding all relevant comments
   * @param activeEditor The active text editor containing the code document
   */
  public ApplyDecorations(activeEditor: vscode.TextEditor): void {
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
  private setDelimiter(languageCode: string): void {
    this.supportedLanguage = true;
    switch (languageCode) {
      case "javascript":
      case "javascriptreact":
      case "typescript":
      case "typescriptreact":
        this.setCommentFormat("//", "/*", "*/");
        break;
      case "html":
      case "markdown":
      case "xml":
        this.setCommentFormat("<!--", "<!--", "-->");
        break;
      default:
        this.supportedLanguage = false;
        break;
    }
  }

  /**
   * Sets the highlighting tags up for use by the parser
   */
  private setTagsSearch(): void {
    let items = default_tags;
    for (let item of items) {
      let options: vscode.DecorationRenderOptions = { color: item.color, backgroundColor: item.backgroundColor };

      // the textDecoration is initialized to empty
      options.textDecoration = "";
      if (item.strikethrough) options.textDecoration += "line-through";
      if (item.underline) options.textDecoration += " underline";
      if (item.bold) options.fontWeight = "bold";
      if (item.italic) options.fontStyle = "italic";

      let escapedSequence = item.tag.replace(/([()[{*+.$^\\|?])/g, "\\$1");
      this.tags.push({
        tag: item.tag,
        escapedTag: escapedSequence.replace(/\//gi, "\\/"), // ! hardcoded to escape slashes
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
  private escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
  }

  /**
   * Set up the comment format for single and multiline highlighting
   * @param singleLine The single line comment delimiter. If NULL, single line is not supported
   * @param start The start delimiter for block comments
   * @param end The end delimiter for block comments
   */
  private setCommentFormat(singleLine: string | null, start: string, end: string): void {
    // If no single line comment delimiter is passed, single line comments are not supported
    if (singleLine) {
      this.delimiter = this.escapeRegExp(singleLine);
    }
    //  else {
    //   this.highlightSingleLineComments = false;
    // }

    this.blockCommentStart = this.escapeRegExp(start);
    this.blockCommentEnd = this.escapeRegExp(end);
  }
}

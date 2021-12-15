import * as vscode from "vscode";
import { tagsDecorationData } from "./TagDecoration";

interface ITag {
  tag: string;
  decoration: vscode.TextEditorDecorationType;
  ranges: vscode.DecorationOptions[]; //all instance of the tag will be catch here.
}

export class Parser {
  private tags: ITag[] = [];
  private expression: string = ""; //Regular Expression
  private delimiter: string = "";
  private supportedLanguage = true;

  public constructor() {
    this.initializeTagsSearch();
  }

  public isLanguageSupported() {
    return this.supportedLanguage;
  }

  /**
   * Sets the highlighting tags up for use by the parser
   */
  private initializeTagsSearch(): void {
    let items = tagsDecorationData;
    for (let item of items) {
      let options: vscode.DecorationRenderOptions = { color: item.color, backgroundColor: item.backgroundColor };

      // the textDecoration is initialized to empty
      options.textDecoration = "";
      if (item.strikethrough) options.textDecoration += "line-through";
      if (item.underline) options.textDecoration += " underline";
      if (item.bold) options.fontWeight = "bold";
      if (item.italic) options.fontStyle = "italic";

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
  public setRegexPatternsByLanguageId(languageCode: string) {
    this.setDetectCommentFormat(languageCode);

    // if the language does not supported, in the setDetectCommentFormat method; return
    if (!this.supportedLanguage) {
      return;
    }

    // Collect all starting tags
    let start_tags_array: string[] = [];
    let start_tags: string = "";
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
  private setDetectCommentFormat(languageCode: string): void {
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
  private setCommentFormat(singleLineDetectorSign: string): void {
    if (singleLineDetectorSign) this.delimiter = singleLineDetectorSign;
    else {
    }
  }

  //=================== Find comments ===================
  /**
   * Finds all single line comments delimited by a given delimiter and matching tags specified in tagsDecorationData
   * @param activeTextEditor The active text editor containing the code document
   */
  public FindSingleLineComments(activeTextEditor: vscode.TextEditor): void {
    // Fetch all text from the active text editor
    let text = activeTextEditor.document.getText();

    // Global pattern flags:
    // g modifier: global. All matches (don't return after first match)
    // i modifier: insensitive. Case insensitive match (ignores case of [a-zA-Z])
    let regexFlags = "ig";
    let regEx = new RegExp(this.expression, regexFlags);

    let match: any;
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
  public ApplyDecorations(activeTextEditor: vscode.TextEditor): void {
    for (let tag of this.tags) {
      activeTextEditor.setDecorations(tag.decoration, tag.ranges);

      // clear the ranges for the next pass
      tag.ranges.length = 0;
    }
  }
}

interface ITagDecoration {
  tag: string;
  color: string;
  strikethrough: boolean;
  underline: boolean;
  bold: boolean;
  italic: boolean;
  backgroundColor: string;
}

//Add any tags that you want to find in the text and change the style of them right after comment. (e.g: //todo  //tip)
export const tagsDecorationData: ITagDecoration[] = [
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

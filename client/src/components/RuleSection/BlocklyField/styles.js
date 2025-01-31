import * as Blockly from 'blockly';

export const ColorPalette = {
  lv1: "#706fd3",
  lv2: "#227093",
  lv3: "#218c74",
  lv4: "#e6b225",
  lv5: "#e88335",
  lv6: "#cc8e35",
  locked: "#808080",
  banned: "#ff0000",
};

export const MAIN_THEME = Blockly.Theme.defineTheme("main", {
  base: Blockly.Themes.Zelos,
  blockStyles: {
    rule: {
      hat: "cap",
      colourPrimary: ColorPalette.lv1,
    },
  },
});

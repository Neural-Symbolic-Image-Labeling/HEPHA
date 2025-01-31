import * as Blockly from "blockly";
import { logger } from "../../../utils/logger";
import { registerContextMenuItems } from "./contextMenuItems";
import { ruleGenerator } from "./jsonAssembler";
import { rule_parser } from "./parser";
import { ColorPalette, MAIN_THEME } from "./styles";

Blockly.utils.colour.setHsvSaturation(0.53);
Blockly.utils.colour.setHsvValue(0.75);

export const BLOCK_DICT = {
  // basic: ["text", "logic_boolean", "math_number"],
  fixed: ["rule"],
  connect: ["clause"],
  // predicate: ["has", "has_num", "has_area", "overlap", "not"],
  predicate: ["has", "overlap", "not"],
  predefinedNum: [""],
  predefinedBool: [],
  predefinedString: [],
  predefinedDropdown: [],
};

const blocksInClause = BLOCK_DICT.predicate
  .concat(BLOCK_DICT.predefinedBool)
  .concat(BLOCK_DICT.predefinedNum);

const _filterObjList = (objList, prefix) => {
  // filter out the object list with the prefix
  if (prefix === "     ") {
    return objList.map((obj) => [obj, obj.split(" (")[0]]);
  }
  let result = objList.filter((obj) => obj.startsWith(prefix));
  // split each object with the prefix "(" and take the first part
  return result.map((obj) => [obj, obj.split(" (")[0]]);
};

/**
 * Convert the current workspace to Rules in database format.
 * @param {Blockly.Workspace} workspace
 * @returns {Array} array of rules in JSON format
 */
export const formatRules = (workspace) => {
  // get all rule blocks
  const ruleBlocks = workspace.getBlocksByType("rule");
  const rules = [];
  // convert each rule block to code string
  for (let ruleBlock of ruleBlocks) {
    const rule = JSON.parse(ruleGenerator.blockToCode(ruleBlock));
    rules.push(rule);
  }
  return rules;
};

/**
 * Setup context menu for the workspace
 */
export const setupContextMenu = () => {
  try {
    // unregister unused default menu items
    Blockly.ContextMenuRegistry.registry.unregister("cleanWorkspace");
    Blockly.ContextMenuRegistry.registry.unregister("workspaceDelete");
    Blockly.ContextMenuRegistry.registry.unregister("blockHelp");
    Blockly.ContextMenuRegistry.registry.unregister("blockDisable");
    Blockly.ContextMenuRegistry.registry.unregister("blockInline");
    Blockly.ContextMenuRegistry.registry.unregister("blockDuplicate");
    Blockly.ContextMenuRegistry.registry.unregister("blockDelete");
    Blockly.ContextMenuRegistry.registry.unregister("blockComment");
    Blockly.ContextMenuRegistry.registry.unregister("blockCollapseExpand");
    // register new context menu items
    registerContextMenuItems();

    // print all menu items
    // console.log(Blockly.ContextMenuRegistry.registry.registry_);
  } catch (err) {
    console.log(err);
  }
};

/**
 * Apply colors to the rule blocks in the workspace
 * @param {Blockly.Workspace} workspace
 * @param {Object} colors
 */
export const applyColorsToRuleBlocks = (workspace, colors) => {
  if (!workspace) return;
  const ruleBlocks = workspace.getBlocksByType("rule");
  ruleBlocks.forEach((ruleBlock) => {
    const ruleName = ruleBlock.getFieldValue("NAME");
    if (
      !colors[ruleName] ||
      colors[ruleName] === "" ||
      colors[ruleName] === undefined
    ) {
      return;
    }
    ruleBlock.setColour(colors[ruleName]);
  });
};

/**
 * Add a block to a workspace
 * @param {Blockly.serialization.blocks.State} blockState in JSON format
 * @param {Blockly.Workspace} workspace
 * @returns {Blockly.Block} the added block
 */
const _addBlockToWorkspace = (blockState, workspace) => {
  return Blockly.serialization.blocks.append(blockState, workspace);
};

/**
 * Save and reload the workspace content. Used after block or configuration change.
 * @param {*} workspace
 */
export const refreshWorkspace = (workspace) => {
  const tempWorkspace = Blockly.serialization.workspaces.save(workspace);
  // alert(JSON.stringify(tempWorkspace));
  Blockly.serialization.workspaces.load(tempWorkspace, workspace);
};

/**
 * Revert the workspace to the initial state
 * @param {Blockly.WorkspaceSvg} workspace
 * @param {*} rules
 */
export const resetWorkspace = (workspace, rules, birdPreds = []) => {
  // load theme
  workspace.setTheme(MAIN_THEME);

  workspace.clear();
  workspace.clearUndo();

  var medicalPreds = ["ACDR", "HCDR", "VCDR"];

  var out = [];
  rules.forEach((rule) => {
    if (rule["clauses"] !== undefined) {
      var out_rule = [];
      rule["clauses"].forEach((clause) => {
        var lock = clause["locked"] ? "1%" : "0%";
        var out_clause = [];

        for (var i = 0; i < clause["literals"].length; i++) {
          var literal = clause["literals"][i]["literal"];
          var literal_str = "";

          var name = literal.split("(")[0].replace("¬", "");
          // alert(name);
          // alert(JSON.stringify(birdPreds))
          var not = literal.includes("¬");
          // Overlap
          if (literal.includes("overlap")) {
            literal_str = literal.replace(",", ", ");
          } else if (birdPreds.includes(name)) {
            var obj1 = literal.split("(")[1].split(",")[1].replace(")", "");
            literal_str =
              "bird(bird_" +
              name +
              ", " +
              obj1 +
              ", " +
              "-1" +
              ", " +
              "-1" +
              ", " +
              "-1" +
              ", " +
              "-1" +
              ", " +
              not +
              ")";
            // alert(literal_str);
          } else if (medicalPreds.includes(name)) {
            var obj1 = "medical_" + name.toLowerCase();
            var next_literal = clause["literals"][i + 2]["literal"];
            var min = next_literal.split("(")[1].split(",")[1];
            var max = next_literal.split("(")[1].split(",")[2].replace(")", "");
            literal_str =
              "medical(" +
              obj1 +
              ", " +
              min +
              ", " +
              max +
              ", " +
              "-1" +
              ", " +
              "-1" +
              ", " +
              "-1" +
              ", " +
              not +
              ")";
            i = i + 2;
          }

          // Has
          else {
            if (i + 1 < clause["literals"].length) {
              // HasNum
              var next_literal = clause["literals"][i + 1]["literal"];
              if (next_literal.includes("num")) {
                var NUM = clause["literals"][i + 2]["literal"];
                var number = NUM[2];
                var num_op = NUM[1];
                literal_str =
                  "hasNum(X, " +
                  name +
                  ", " +
                  num_op +
                  ", " +
                  number +
                  ", " +
                  "-1" +
                  ", " +
                  "-1, " +
                  not +
                  ")";
                i = i + 2;
              }

              // HasArea
              else if (next_literal.includes("area")) {
                var AREA = clause["literals"][i + 2]["literal"];
                var area = AREA[2];
                var area_op = AREA[1];
                literal_str =
                  "hasArea(X, " +
                  name +
                  ", " +
                  "-1" +
                  ", " +
                  "-1" +
                  ", " +
                  area_op +
                  ", " +
                  area +
                  not +
                  ")";
                i = i + 2;
              }

              // Has
              else {
                literal_str =
                  "has(X, " +
                  name +
                  ", " +
                  "-1" +
                  ", " +
                  "-1" +
                  ", " +
                  "-1" +
                  ", " +
                  "-1" +
                  ", " +
                  not +
                  ")";
              }
            } else {
              literal_str =
                "has(X, " +
                name +
                ", " +
                "-1" +
                ", " +
                "-1" +
                ", " +
                "-1" +
                ", " +
                "-1" +
                ", " +
                not +
                ")";
            }
          }

          out_clause.push(literal_str);
        }
        out_rule.push(lock + "[" + out_clause.join(", ") + "]");
      });
      out.push(rule["name"] + ": {" + out_rule + "}");
    }
  });
  if (out.length > 0) {
    var index = 1;
    var blocks = 0;
    var y = 0;
    out.forEach((rule) => {
      if (index == 1) {
        var res = rule_parser(rule, 0, y);
        blocks = JSON.parse(res);
        index++;
      } else {
        var res = rule_parser(rule, 1, y);
        var rule_block = JSON.parse(res);
        blocks["blocks"]["blocks"].push(rule_block);
      }
    });
    Blockly.serialization.workspaces.load(blocks, workspace);
    /** @type {Blockly.BlockSvg} */
    var ruleBlocks = workspace.getBlocksByType("rule");
    ruleBlocks.forEach((ruleBlock) => {
      ruleBlock.moveTo(new Blockly.utils.Coordinate(0, y));
      y += ruleBlock.height;
    });
    workspace.clearUndo();
  }

  // load the new rules into the workspace
  // TODO: call parse api to get the new workspace
  // const newWorkspace = parseToWorkspace(rules);
  // Blockly.serialization.workspaces.load(newWorkspace, workspace)

  // This should be removed once the parse api is implemented
  // placeAllRuleBlocks(rules, workspace);
};

/**
 * Define all blocks
 * @param {*} opts
 */
export const initBlockDefs = (opts) => {
  // alert(JSON.stringify(opts.detObjs));
  if (opts.detObjs.length === 0) {
    opts.detObjs = ["None"];
  }
  if (opts.segObjs.length === 0) {
    opts.segObjs = ["None"];
  }
  const objList = [...opts.detObjs, ...opts.segObjs];
  createClauseBlock();
  createHasBlock(objList);
  createHasBlockWithNum(opts.detObjs);
  createHasBlockWithArea(opts.segObjs);
  createOverlapBlock(objList);
  createRuleBlocks();
  createNotBlock();
  createMedicalACDRBlock();
  createMedicalHCDRBlock();
  createMedicalVCDRBlock();

  // create predefined blocks
  // for (const pred of BLOCK_DICT.predefinedNum) {
  //   createPredefinedNumberBlock(pred);
  // }
  // for (const pred of BLOCK_DICT.predefinedBool) {
  //   createPredefinedBoolBlock(pred);
  // }
  // for (const pred of BLOCK_DICT.predefinedString) {
  //   createPredefinedStringBlock(pred);
  // }
  // for (const pred of BLOCK_DICT.predefinedDropdown) {
  //   createPredefinedDropdownBlock(pred.name, pred.options);
  // }

  // register blocks for bird image set
  if (opts.datasetType === "Bird") {
    for (let pred of Object.keys(opts.birdPredicates)) {
      // console.log(pred, opts.birdPredicates[pred]);
      createPredefinedDropdownBlock(pred, opts.birdPredicates[pred], "bird_");
    }
  }
};

/**
 * Add event listener to the workspace for logs.
 * @param {Blockly.WorkspaceSvg} workspace
 */
export const initEventListener = (workspace) => {
  workspace.addChangeListener((event) => {
    // addition event listener
    if (event.type === Blockly.Events.BLOCK_CREATE) {
      /** @type { Blockly.Events.BlockCreate }*/
      let e = event;
      if (e.json && e.json.type !== "rule")
        logger.currState.rules.additions.push(e.json.type);
    }
    // deletion event listener
    else if (event.type === Blockly.Events.BLOCK_DELETE) {
      logger.currState.rules.deletionCount += 1;
    }
  });
};

export const buildToolBox = (type, birdPredicates = {}) => {
  // alert(type);
  let predicates = [];
  if (type === "Bird") {
    predicates = Object.keys(birdPredicates).map((pred) => `bird_${pred}`);
    predicates.push("not");
  } else if (type === "Medical") {
    predicates = ["medical_acdr", "medical_hcdr", "medical_vcdr"];
  } else {
    predicates = ["has", "has_num", "has_area", "overlap", "not"];
  }

  const newToolbox = {
    // kind: "categoryToolbox",
    contents: [
      {
        kind: "category",
        name: ">",
        contents: [],
      },
    ],
  };
  // BLOCK_DICT.basic.forEach((blockName) => {
  //   newToolbox.contents[0].contents.push({
  //     kind: "block",
  //     type: blockName
  //   })
  // });
  BLOCK_DICT.connect.forEach((blockName) => {
    newToolbox.contents[0].contents.push({
      kind: "block",
      type: blockName,
    });
  });
  predicates.forEach((blockName) => {
    newToolbox.contents[0].contents.push({
      kind: "block",
      type: blockName,
    });
  });

  return newToolbox;
};

/**
 * Place all rule blocks in the workspace
 * @param {*} rules
 * @param {Blockly.Workspace} workspace
 */
export const placeAllRuleBlocks = (rules, workspace) => {
  let x = 0;
  let y = 0;
  for (let rule of rules) {
    const blkJSON = {
      type: `rule`,
      deletable: false,
      editable: false,
      x: x,
      y: y,
      fields: {
        NAME: rule.name,
      },
    };
    _addBlockToWorkspace(blkJSON, workspace);
    y += 80;
  }
};

export const createRuleBlocks = () => {
  Blockly.Blocks["rule"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Rule:")
        .appendField(new Blockly.FieldLabelSerializable(""), "NAME");
      this.appendStatementInput("CLAUSES").setCheck(["clause"]);
      this.setColour(ColorPalette.lv1);
      this.setTooltip("");
      this.setHelpUrl("");
      this.setStyle("rule");
    },
  };
};

export const createClauseBlock = () => {
  Blockly.Blocks["clause"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("Locked:")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "LOCKED")
        .appendField("Banned:")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "BANNED")
        .setVisible(false);
      this.appendStatementInput("LITERALS").setCheck(blocksInClause);
      this.appendDummyInput().appendField("or");
      this.setPreviousStatement(true, "clause");
      this.setNextStatement(true, "clause");
      this.setColour(ColorPalette.lv2);
      this.setTooltip("");
      this.setHelpUrl("");

      // listen to the change of the locked checkbox
      this.getField("LOCKED").setValidator((newValue) => {
        if (newValue === "TRUE") {
          this.setDeletable(false);
          this.setMovable(false);
          this.setColour(ColorPalette.locked);
          for (let child of this.getDescendants(true)) {
            if (child.type === "clause" && child.id !== this.id) {
              break;
            }
            if (child.type !== "clause") {
              child.setEditable(false);
              child.setDeletable(false);
              child.setMovable(false);
            }
          }
        } else {
          this.setColour(ColorPalette.lv2);
          this.setDeletable(true);
          this.setMovable(true);
          for (let child of this.getDescendants(true)) {
            if (child.type === "clause" && child.id !== this.id) {
              break;
            }
            if (child.type !== "clause") {
              child.setEditable(true);
              child.setDeletable(true);
              child.setMovable(true);
            }
          }
        }
      });

      // listen to the change of the banned checkbox
      this.getField("BANNED").setValidator((newValue) => {
        if (newValue === "TRUE") {
          // this.setColour(ColorPalette.banned);
          for (let child of this.getDescendants(true)) {
            if (child.type === "clause" && child.id !== this.id) {
              break;
            }
            if (child.type !== "clause") {
              // set all descendants to disabled
              child.setDisabledReason(true, "Block Banned");
            }
          }
        } else {
          // this.setColour(ColorPalette.lv2);
          for (let child of this.getDescendants(true)) {
            if (child.type === "clause" && child.id !== this.id) {
              break;
            }
            if (child.type !== "clause") {
              child.setDisabledReason(false, "Block Banned");
            }
          }
        }
      });
    },
  };
};

export const createHasBlock = (objList = ["None"]) => {
  // const dropdownList = objList.map((obj) => [obj, obj]);
  Blockly.Blocks["has"] = {
    init: function () {
      this.appendDummyInput("ROW")
        .appendField(new Blockly.FieldLabelSerializable("Has"), "HAS_STRING")
        .appendField(
          new Blockly.FieldImage(
            "https://img.icons8.com/?size=512&id=132&format=png", // Image URL
            14, // Width of the image
            14, // Height of the image
            "*",
            this.toggleSearchField.bind(this)
          ),
          "ICON"
        ) // Alt text for accessibility, initially invisible
        // .appendField(new Blockly.FieldTextInput(""), "SEARCH_TEXT")
        // .appendField(new Blockly.FieldCheckbox("TRUE"), "NOT")
        .appendField(
          new Blockly.FieldDropdown(
            this.getDropdownList.bind(this),
            this.onItemSelected.bind(this)
          ),
          "OBJECT"
        );
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField("and");
      this.setInputsInline(false);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setColour(ColorPalette.lv3);
      this.setTooltip("");
      this.setHelpUrl("");

      this.searchFieldVisible = false; // Track the visibility state of the search input field
    },

    toggleSearchField: function () {
      const rowInput = this.getInput("ROW");
      if (!this.searchFieldVisible) {
        rowInput.insertFieldAt(
          2,
          new Blockly.FieldTextInput(""),
          "SEARCH_TEXT"
        );
      } else {
        rowInput.removeField("SEARCH_TEXT");
      }
      this.searchFieldVisible = !this.searchFieldVisible;
      this.render();
    },
    getDropdownList: function () {
      let searchQuery;
      try {
        searchQuery = this.getFieldValue("SEARCH_TEXT") || "     ";
      } catch (e) {
        searchQuery = "     ";
      }
      let dropdownList = _filterObjList(objList, searchQuery);
      if (dropdownList.length === 0) {
        dropdownList = [["None", "None"]];
      }
      return dropdownList;
    },
    onItemSelected: function (option) {
      try {
        this.setFieldValue("     ", "SEARCH_TEXT");
        this.toggleSearchField();
      } catch (e) {}
      
    },
  };
};

export const createHasBlockWithNum = (objList = ["None"]) => {
  const dropdownList = objList.map((obj) => [obj, obj]);
  Blockly.Blocks["has_num"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabelSerializable("Has"), "HAS_STRING")
        // .appendField(new Blockly.FieldCheckbox("TRUE"), "NOT")
        .appendField(
          new Blockly.FieldDropdown([
            ["more", ">"],
            ["less", "<"],
          ]),
          "OPERATOR"
        )
        .appendField("than")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 1), "NUM")
        .appendField(new Blockly.FieldDropdown(dropdownList), "OBJECT")
        .appendField("s.");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField("and");
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setColour(ColorPalette.lv3);
      this.setTooltip("");
      this.setHelpUrl("");

      // listen to the change of the NOT checkbox
      // this.getField("NOT").setValidator((newValue) => {
      //   if (newValue === "TRUE") {
      //     this.setFieldValue("Has", "HAS_STRING");
      //   } else {
      //     this.setFieldValue("Has no", "HAS_STRING");
      //   }
      // });
    },
  };
};

export const createHasBlockWithArea = (objList = ["None"]) => {
  const dropdownList = objList.map((obj) => [obj, obj]);
  Blockly.Blocks["has_area"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabelSerializable("Has"), "HAS_STRING")
        // .appendField(new Blockly.FieldCheckbox("TRUE"), "NOT")
        .appendField(new Blockly.FieldDropdown(dropdownList), "OBJECT")
        .appendField("with area of")
        .appendField(
          new Blockly.FieldDropdown([
            ["more", ">"],
            ["less", "<"],
          ]),
          "OPERATOR"
        )
        .appendField("than")
        .appendField(new Blockly.FieldNumber(0, 0), "AREA")
        .appendField(".");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField("and");
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setColour(ColorPalette.lv3);
      this.setTooltip("");
      this.setHelpUrl("");

      // listen to the change of the NOT checkbox
      // this.getField("NOT").setValidator((newValue) => {
      //   if (newValue === "TRUE") {
      //     this.setFieldValue("Has", "HAS_STRING");
      //   } else {
      //     this.setFieldValue("Has no", "HAS_STRING");
      //   }
      // });
    },
  };
};

export const createOverlapBlock = (objList = ["None"]) => {
  const dropdownList = objList.map((obj) => [obj, obj]);
  Blockly.Blocks["overlap"] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown(dropdownList), "OBJ1")
        .appendField("overlaps with")
        .appendField(new Blockly.FieldDropdown(dropdownList), "OBJ2");
      this.appendDummyInput()
        .setAlign(Blockly.inputs.Align.CENTRE)
        .appendField("and");
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setColour(ColorPalette.lv3);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

export const createNotBlock = () => {
  Blockly.Blocks["not"] = {
    init: function () {
      this.appendDummyInput().appendField("Not");
      this.appendStatementInput("PRED").setCheck([
        "has",
        "has_num",
        "has_area",
      ]);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setColour(ColorPalette.lv4);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createPredefinedNumberBlock = (ruleName) => {
  Blockly.Blocks[ruleName] = {
    init: function () {
      this.appendDummyInput()
        .appendField(ruleName, "TEXT")
        .appendField(new Blockly.FieldNumber(0, -Infinity, Infinity, 5), "NUM");
      this.setOutput(true, "Number");
      this.setColour(ColorPalette.lv5);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createPredefinedBoolBlock = (ruleName) => {
  Blockly.Blocks[ruleName] = {
    init: function () {
      this.appendDummyInput()
        .appendField(ruleName, "TEXT")
        .appendField(new Blockly.FieldCheckbox("FALSE"), "BOOL");
      this.setOutput(true, "Boolean");
      this.setColour(ColorPalette.lv5);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createPredefinedStringBlock = (ruleName, prefix = "") => {
  Blockly.Blocks[prefix + ruleName] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabelSerializable(ruleName), "TEXT")
        .appendField(new Blockly.FieldTextInput(""), "STRING");
      this.setOutput(true, "String");
      this.setColour(ColorPalette.lv3);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createPredefinedDropdownBlock = (ruleName, options, prefix) => {
  const dropdownList = options.map((option) => [option, option]);
  Blockly.Blocks[prefix + ruleName] = {
    init: function () {
      this.appendDummyInput()
        .appendField(new Blockly.FieldLabelSerializable(ruleName), "TEXT")
        .appendField(new Blockly.FieldDropdown(dropdownList), "DROPDOWN");
      this.setColour(ColorPalette.lv5);
      // this.setPreviousStatement(true, blocksInClause);
      // this.setNextStatement(true, blocksInClause);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createMedicalACDRBlock = () => {
  Blockly.Blocks["medical_acdr"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("ACDR with area between ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 0), "MIN")
        .appendField(" and ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 0), "MAX");
      this.setColour(ColorPalette.lv3);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createMedicalHCDRBlock = () => {
  Blockly.Blocks["medical_hcdr"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("HCDR with area between ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 15), "MIN")
        .appendField(" and ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 15), "MAX");
      this.setColour(ColorPalette.lv3);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

const createMedicalVCDRBlock = () => {
  Blockly.Blocks["medical_vcdr"] = {
    init: function () {
      this.appendDummyInput()
        .appendField("VCDR with area between ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 15), "MIN")
        .appendField(" and ")
        .appendField(new Blockly.FieldNumber(0, 0, Infinity, 15), "MAX");
      this.setColour(ColorPalette.lv3);
      this.setPreviousStatement(true, blocksInClause);
      this.setNextStatement(true, blocksInClause);
      this.setTooltip("");
      this.setHelpUrl("");
    },
  };
};

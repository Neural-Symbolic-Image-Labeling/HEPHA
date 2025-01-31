import { Box, Button, TextField } from "@mui/material";
import * as Blockly from 'blockly';
import { useEffect, useRef, useState } from "react";
import { useBlocklyWorkspace } from "react-blockly";
import { useMyBlocklyWorkspace } from "../../../context/BlocklyWorkspaceContext";
import { useClassColor } from "../../../context/ClassColorContext";
import * as MyBlockly from "./blocks";
import { ruleGenerator, setBirdRuleGenerator } from "./jsonAssembler";
import { rule_parser } from "./parser";
import "./style.css";
import { translateRules } from "./translater";

const DEBUG_MODE = false;

export const BlockyField = ({
  imgSetType,
  rules = [],
  segObjs = [],
  detObjs = [],
  birdPredicates = {},
  wkspOp,
  setWkspOp,
}) => {
  const { setBlocklyWorkspace } = useMyBlocklyWorkspace();

  const { colors: classColors } = useClassColor();

  let workspaceInited = false;
  const blocklyRef = useRef(null);
  const [toolbox, setToolbox] = useState({
    kind: "categoryToolbox",
    contents: [],
  });
  const { workspace, json } = useBlocklyWorkspace({
    ref: blocklyRef,
    toolboxConfiguration: toolbox, // this must be a JSON toolbox definition
    initialJson: {},
    workspaceConfiguration: {
      trashcan: false,
      move: {
        scrollbars: {
          horizontal: false,
          vertical: true,
        },
        drag: true,
        wheel: true,
      },
    },
    // onInject: (workspace) => {
    //   workspace.scrollbar = new Blockly.ScrollbarPair(workspace, false, true);
    // }
  });

  useEffect(() => {
    // if all false, return

    if (wkspOp.undo) {
      workspace.undo(false);
      setWkspOp((prev) => ({ ...prev, undo: false }));
    } else if (wkspOp.redo) {
      workspace.undo(true);
      setWkspOp((prev) => ({ ...prev, redo: false }));
    } else if (wkspOp.lock.action) {
      let currBlk = Blockly.getSelected();
      let workspace = Blockly.getMainWorkspace();

      for (let currBlk of workspace.getAllBlocks()) {
        if (currBlk && currBlk.type === "clause") {
          if (
            currBlk.getFieldValue("LOCKED") === true ||
            currBlk.getFieldValue("LOCKED") === "TRUE"
          ) {
            if (!wkspOp.lock.tlock) {
              currBlk.setFieldValue("FALSE", "LOCKED");
            }
          } else if (wkspOp.lock.tlock) {
            currBlk.setFieldValue("TRUE", "LOCKED");
          }
        }
      }
      setWkspOp((prev) => ({
        ...prev,
        lock: { action: false, tlock: prev.lock.tlock },
      }));
    } else if (wkspOp.ban) {
      let currBlk = Blockly.getSelected();
      if (currBlk && currBlk.type === "clause") {
        if (
          currBlk.getFieldValue("BANNED") === true ||
          currBlk.getFieldValue("BANNED") === "TRUE"
        ) {
          currBlk.setFieldValue("FALSE", "BANNED");
          for (let des of currBlk.getDescendants()) {
            des.setDisabledReason(false, "Block Banned");
            des.setDeletable(false);
          }
        } else {
          currBlk.setFieldValue("TRUE", "BANNED");
          for (let des of currBlk.getDescendants()) {
            des.setDisabledReason(true, "Block Banned");
            des.setDeletable(true);
          }
        }
      }
      setWkspOp((prev) => ({ ...prev, ban: false }));
    }
  }, [wkspOp]);

  useEffect(() => {
    if (workspace && !workspaceInited) {
      const bp = JSON.parse(JSON.stringify(birdPredicates));
      MyBlockly.initBlockDefs({
        rules: rules,
        segObjs: JSON.parse(JSON.stringify(segObjs)),
        detObjs: JSON.parse(JSON.stringify(detObjs)),
        datasetType: imgSetType,
        birdPredicates: bp,
      });
      if (imgSetType === "Bird") {
        setBirdRuleGenerator(bp);
      }
      MyBlockly.setupContextMenu();
      workspaceInited = true;

      setToolbox(MyBlockly.buildToolBox(imgSetType, bp));

      MyBlockly.initEventListener(workspace);
      MyBlockly.resetWorkspace(workspace, rules, Object.keys(bp));

      // store the workspace in the store
      setBlocklyWorkspace(workspace);
    }

    return () => {
      workspaceInited = false;
      if (workspace) {
        workspace.clearUndo();
        workspace.clear();
      }
    };
  }, [workspace, imgSetType]);

  // Listen to changes in the toolbox and update it in the workspace.
  useEffect(() => {
    if (!workspace) return;
    workspace.updateToolbox(toolbox);
  }, [toolbox]);

  // Listen to changes in the object list and redefine the related blocks.
  useEffect(() => {
    const bp = JSON.parse(JSON.stringify(birdPredicates));
    if (!workspace) return;
    MyBlockly.initBlockDefs({
      rules: rules,
      segObjs: JSON.parse(JSON.stringify(segObjs)),
      detObjs: JSON.parse(JSON.stringify(detObjs)),
      datasetType: imgSetType,
      birdPredicates: bp,
    });
    // Refresh the workspace to apply changes.
    MyBlockly.refreshWorkspace(workspace);

    // reset bird rule generator
    if (imgSetType === "Bird") {
      setBirdRuleGenerator(bp);
    }

    setToolbox(MyBlockly.buildToolBox(imgSetType, bp));

    if (!classColors) return;
    MyBlockly.applyColorsToRuleBlocks(workspace, classColors);
  }, [segObjs, detObjs, imgSetType, birdPredicates]);

  useEffect(() => {
    if (!workspace) return;
    // alert("rules changed")
    if (birdPredicates) {
      const bp = JSON.parse(JSON.stringify(birdPredicates));
      MyBlockly.initBlockDefs({
        rules: rules,
        segObjs: JSON.parse(JSON.stringify(segObjs)),
        detObjs: JSON.parse(JSON.stringify(detObjs)),
        datasetType: imgSetType,
        birdPredicates: bp,
      });
    }
    MyBlockly.resetWorkspace(workspace, rules, Object.keys(birdPredicates));
    MyBlockly.refreshWorkspace(workspace);

    if (!classColors) return;
    MyBlockly.applyColorsToRuleBlocks(workspace, classColors);
  }, [rules]);

  useEffect(() => {
    if (!classColors) return;
    MyBlockly.applyColorsToRuleBlocks(workspace, classColors);
  }, [classColors]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "seashell",
      }}
    >
      <div
        ref={blocklyRef}
        style={{
          height: DEBUG_MODE ? "80%" : "100%",
          width: "100%",
        }}
        className="test"
      />
      {!DEBUG_MODE ? null : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Button
            onClick={() => {
              rule_parser();
            }}
          >
            Parse
          </Button>
          <Button
            onClick={() => {
              alert(
                JSON.stringify(
                  Blockly.serialization.workspaces.save(workspace),
                ),
              );
            }}
          >
            Deserilize workspace
          </Button>
          <Button
            onClick={() => {
              let curr = Blockly.getSelected();
              alert(ruleGenerator.blockToCode(curr));
            }}
          >
            Code Block
          </Button>
          <Button
            onClick={() => {
              alert(JSON.stringify(MyBlockly.formatRules(workspace)));
            }}
          >
            Code Workspace
          </Button>
          <Button
            onClick={() => {
              if (imgSetType === "Medical") {
                alert(
                  JSON.stringify(
                    translateRules(MyBlockly.formatRules(workspace), [
                      "ACDR",
                      "HCDR",
                      "VCDR",
                    ]),
                  ),
                );
              } else {
                alert(
                  JSON.stringify(
                    translateRules(MyBlockly.formatRules(workspace), [
                      ...detObjs,
                      ...segObjs,
                    ]),
                  ),
                );
              }
            }}
          >
            translate result
          </Button>
          {/* <Button onClick={() => {
            Blockly.serialization.workspaces.load(JSON.parse(document.getElementById('json-text').value), workspace)
          }}>Load JSON</Button> */}
          <Button
            onClick={() => {
              /** @type {Blockly.BlockSvg} */
              let curr = Blockly.getSelected();
              curr.moveTo(new Blockly.utils.Coordinate(0, curr.height));
            }}
          >
            show height
          </Button>
          {/* <TextField id="obj-text" /> */}
          <TextField id="json-text" />
          <Button
            onClick={() => {
              console.log(Blockly.Blocks);
            }}
          >
            block defs
          </Button>
        </Box>
      )}
    </Box>
  );
};

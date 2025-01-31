import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestTrailLabel
} from "../../apis/workspace";
import { loadWorkspacePart } from "../../stores/workspace";
import { logger } from "../../utils/logger";
import { findCollection, getobjList } from "../../utils/workspace";
import { PaperFrame } from "../PaperFrame";
import { BlockyField } from "./BlocklyField";

import { Lock, LockOpen, Redo, Undo } from "@mui/icons-material";
import { useMyBlocklyWorkspace } from "../../context/BlocklyWorkspaceContext";

const mockupRules = [{ name: "rule1" }, { name: "rule2" }];

export const RuleSection = () => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace.workspace);
  const isLoading = useSelector((state) => state.workspace.loading);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const [rules, setRules] = useState(mockupRules);
  const [previewInProgress, setPreviewInProgress] = useState(false);
  const [wkspOp, setWkspOp] = useState({
    undo: false,
    redo: false,
    lock: { action: false, tlock: false },
    ban: false,
  });

  const { getCurrentRuleJSON } = useMyBlocklyWorkspace();
  const segList = useMemo(() => {
    // return currCollection ? currCollection.area_object_list : ["None"]
    return [];
  }, [currCollection]);

  const detList = useMemo(() => {
    return getobjList(currCollection);
  }, [currCollection?.tfidf, currCollection?.num_object_list]);

  const handlePreview = () => {
    setPreviewInProgress(true);
    logger.currState.rules.previewCount += 1;

    // generate current rule json
    const newRule = getCurrentRuleJSON();

    // convert new rule to dict of lists of lists
    console.log("preview: current rule: ", newRule);
    // convert new rule to dict of lists of lists
    const newRuleDict = {};
    for (let rule of newRule) {
      let curr_rule = [];
      for (let clause of rule.clauses) {
        let curr_clause = [];
        for (let literal of clause.literals) {
          // console.log("literal: ", literal);
          curr_clause.push(literal.literal);
        }
        curr_rule.push(curr_clause);
      }
      newRuleDict[rule.name] = curr_rule;
    }
    console.log("preview: new rule dict after convertion: ", newRuleDict);

    // request preview
    requestTrailLabel(
      workspace._id,
      currCollectionId,
      currCollection.method,
      newRuleDict,
      currCollection.type,
      false,
    )
      .then(() => {
        dispatch(
          loadWorkspacePart({
            workspaceName: workspace.name,
            collectionField: "images",
          }),
        );
        dispatch(
          loadWorkspacePart({
            workspaceName: workspace.name,
            collectionField: "statistics",
          }),
        );
        setPreviewInProgress(false);
      })
      .catch((err) => {
        setPreviewInProgress(false);
        console.log(err);
      });
  };

  useEffect(() => {
    if (workspace && currCollection) {
      setRules(JSON.parse(JSON.stringify(currCollection.rules)));
      return;
    }
  }, [currCollection?.rules]);

  return (
    <PaperFrame
      col
      sx={{
        alignItems: "center",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        p: "10px 25px 25px 25px",
        mt: "10px",
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box",
          mb: "18px",
        }}
      >
        <Typography
          variant="h5"
          color="purple.dark"
          sx={{
            fontWeight: "bold",
            fontSize: "18px",
            lineHeight: "19px",
          }}
        >
          Labeling Rules
        </Typography>
        {/* {JSON.stringify(detList)} */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            width: "100%",
          }}
        >
          <IconButton
            color="primary"
            onClick={() =>
              setWkspOp((prev) => ({
                ...prev,
                lock: { action: true, tlock: !prev.lock.tlock },
              }))
            }
          >
            {wkspOp.lock.tlock ? <LockOpen /> : <Lock />}
          </IconButton>
          {/* <IconButton color="primary" onClick={() => setWkspOp({ ...wkspOp, ban: true})}>
            <Block />
          </IconButton> */}
          <IconButton
            color="primary"
            onClick={() => setWkspOp({ ...wkspOp, undo: true })}
          >
            <Undo />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => setWkspOp({ ...wkspOp, redo: true })}
          >
            <Redo />
          </IconButton>

          <Button
            size="medium"
            variant="contained"
            sx={{
              bgColor: "purple.dark",
              color: "white",
              ml: "15px",
            }}
            onClick={() => handlePreview()}
            disabled={isLoading || previewInProgress}
          >
            {previewInProgress ? <CircularProgress size={22} /> : "Preview"}
          </Button>
        </Box>
      </Box>
      {currCollection && (
        <BlockyField
          rules={rules}
          segObjs={segList}
          detObjs={detList}
          imgSetType={currCollection.type}
          birdPredicates={currCollection.birdPredicates || {}}
          wkspOp={wkspOp}
          setWkspOp={setWkspOp}
        />
      )}
    </PaperFrame>
  );
};

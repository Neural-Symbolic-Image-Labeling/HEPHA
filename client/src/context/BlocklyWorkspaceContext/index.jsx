import React, { createContext, useContext, useState } from "react";
import { useSelector } from "react-redux";
import { findCollection, getobjList } from "../../utils/workspace";
import { formatRules as BlocklyFormatRules } from "../../components/RuleSection/BlocklyField/blocks";
import { translateRules as BlocklyTransRules } from "../../components/RuleSection/BlocklyField/translater";

const BlocklyWorkspaceContext = createContext(null);

export const BlocklyWorkspaceProvider = ({ children }) => {
  const [blocklyWorkspace, setBlocklyWorkspace] = useState(null);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);

  /**
   * Generate **finalized** rule JSON from the current workspace and collection.
   * @param {*} blocklyWksp
   * @param {*} currCollection
   * @returns
   */
  const getCurrentRuleJSON = () => {
    const objList = getobjList(currCollection);
    const imgSetType = currCollection.type;
    let newRules;
    try {
      newRules = BlocklyFormatRules(blocklyWorkspace);
      if (imgSetType === "Medical") {
        newRules = BlocklyTransRules(newRules, objList);
      } else {
        newRules = BlocklyTransRules(newRules, [...objList]);
      }
    } catch (e) {
      console.log(e);
      return;
    }

    return newRules;
  };

  return (
    <BlocklyWorkspaceContext.Provider
      value={{ getCurrentRuleJSON, setBlocklyWorkspace }}
    >
      {children}
    </BlocklyWorkspaceContext.Provider>
  );
};

export const useMyBlocklyWorkspace = () => {
  return useContext(BlocklyWorkspaceContext);
};

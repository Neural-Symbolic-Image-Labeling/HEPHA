import { login } from "../apis/workspace";
import { translateRules as BlocklyTransRules } from "../components/RuleSection/BlocklyField/translater";
import { formatRules as BlocklyFormatRules } from "../components/RuleSection/BlocklyField/blocks";

export const findCollection = (workspace, collectionId) => {
  if (!workspace || !collectionId) return null;
  return workspace.collections.find(
    (c) => c._id.toString() === collectionId.toString(),
  );
};

/**
 * Acquire the object list of the current collection.
 * NOTICE: segmentation objects are not included.
 */
export const getobjList = (currCollection) => {
  if (!currCollection) return [];
  if (currCollection.type === "Medical") {
    return ["ACDR", "HCDR", "VCDR"];
  }
  if (currCollection.type === "Bird") {
    return currCollection?.num_object_list
      ? currCollection.num_object_list
      : [];
  }
  return currCollection?.tfidf
    ? currCollection.tfidf
    : currCollection?.num_object_list
      ? currCollection.num_object_list
      : [];
};

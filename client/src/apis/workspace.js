import { get, post } from "./axios";

export const autoLogin = async () => {
  return get("/workspace/auto");
};

export const login = async (name) => {
  return post("/workspace/login", { workspaceName: name });
};

export const requestNewCollection = (setName, workspaceId) => {
  return post("/workspace/collection", {
    setName: setName,
    workspaceId: workspaceId,
  });
};

export const requestAutoLabel = (
  workspaceId,
  collectionId,
  mode,
  newRules,
  imgSetName,
  AL,
) => {
  return post("/workspace/label", {
    workspaceId: workspaceId,
    collectionId: collectionId,
    task: "auto",
    mode: mode,
    rule: newRules,
    image_set_name: imgSetName,
    active_learning: AL,
  });
};

export const requestTrailLabel = (
  workspaceId,
  collectionId,
  mode,
  newRules,
  imgSetName,
  AL = false,
) => {
  return post("/workspace/label", {
    workspaceId: workspaceId,
    collectionId: collectionId,
    task: "trail",
    mode: mode,
    rule: newRules,
    image_set_name: imgSetName,
    active_learning: AL,
  });
  // return get('/hello');
};

export const updateRules = (collectionId, rulesData) => {
  return post("/workspace/updaterules", {
    collectionId: collectionId,
    rules: rulesData,
  });
};

export const updateImageMetaData = (collectionId, imgId, imgData) => {
  return post("/workspace/updateImageMetaData", {
    collectionId: collectionId,
    imgId: imgId,
    data: imgData,
  });
};

export const updateStatistics = (collectionId, statisticsData) => {
  return post("/workspace/updateStatistics", {
    collectionId: collectionId,
    data: statisticsData,
  });
};

export const updateMode = (collectionId, mode) => {
  return post("/workspace/updateMode", {
    collectionId: collectionId,
    mode: mode,
  });
};

export const requestBaselineLabel = (
  workspaceId,
  collectionId,
  mode,
  imgSetName,
  resnet_model,
) => {
  return post("/workspace/resnet", {
    workspaceId: workspaceId,
    collectionId: collectionId,
    task: "baseline",
    mode: mode,
    image_set_name: imgSetName,
    resnet_model: resnet_model,
  });
};

export const updateLogs = (collectionName, workspaceName, state) => {
  return post("/workspace/updateLogs", {
    collectionName: collectionName,
    workspaceName: workspaceName,
    state: state,
  });
};

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const WorkstationSlice = createSlice({
  name: "workstation",
  initialState: {
    page: 0, // switch between gallery and annoatation canvas
    currentImage: 0,
    currentTool: "boundingbox",
    viewPred: false,
    currentLabels: "",
    currentInput: "",
    manual: false,
    selectIndex: -1,
    deleteLabel: false,
    currentImageList: [],
    enableAL: true,
    imageListScrollTop: 0,
    ruleSection: {
      blocklyNewRules: "none",
      actionType: "none",
    },
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setCurrentImage: (state, action) => {
      state.currentImage = action.payload;
    },
    setCurrentTool: (state, action) => {
      state.currentTool = action.payload;
    },
    setCurrentLabels: (state, action) => {
      state.currentLabels = action.payload;
    },
    setCurrentInput: (state, action) => {
      state.currentInput = action.payload;
    },
    setManual: (state, action) => {
      state.manual = action.payload;
    },
    setSelectIndex: (state, action) => {
      state.selectIndex = action.payload;
    },
    setDeleteLabel: (state, action) => {
      state.deleteLabel = action.payload;
    },
    setCurrentImageList: (state, action) => {
      state.currentImageList = action.payload;
    },
    setBlocklyNewRules: (state, action) => {
      state.ruleSection.blocklyNewRules = action.payload;
    },
    setActionType: (state, action) => {
      state.ruleSection.actionType = action.payload;
    },
    setEnableAL: (state, action) => {
      state.enableAL = action.payload;
    },
    setViewPred: (state, action) => {
      state.viewPred = action.payload;
    },
    setImageListScrollTop: (state, action) => {
      state.imageListScrollTop = action.payload;
    },
  },
});

export const {
  setPage,
  setCurrentImage,
  setCurrentTool,
  setCurrentLabels,
  setManual,
  setCurrentInput,
  setSelectIndex,
  setDeleteLabel,
  setCurrentImageList,
  setBlocklyNewRules,
  setActionType,
  setEnableAL,
  setViewPred,
  setImageListScrollTop,
} = WorkstationSlice.actions;

export default WorkstationSlice.reducer;

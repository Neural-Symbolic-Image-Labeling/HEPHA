import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { autoLogin, login } from "../../apis/workspace";
import { logger } from "../../utils/logger";
import { calculateAccuracy } from "../../utils/images";
import { generateStatus } from "../../components/StatusBar";

export const fetchWorkspace = createAsyncThunk(
  "workspace/fetchWorkspace",
  async () => {
    const data = await autoLogin();
    return data;
  },
);

export const loadWorkspace = createAsyncThunk(
  "workspace/loadWorkspace",
  async (workspaceName) => {
    const data = await login(workspaceName);
    return data;
  },
);

export const loadWorkspacePart = createAsyncThunk(
  "workspace/loadWorkspacePart",
  async ({ workspaceName, collectionField }) => {
    const data = await login(workspaceName);
    return [data, collectionField];
  },
);

export const workspcaeSlice = createSlice({
  name: "workspace",
  initialState: {
    currCollectionId: null,
    currImageId: null,
    loading: true,
    filters: {
      label: "",
      type: "",
    },
    filterImages: [],
    authed: false,
    /**@type {import ('../../../../models/Workspace/response').IWorkspaceResponse}*/
    workspace: null,
  },
  reducers: {
    setWorkspace: (state, action) => {
      if (!state.workspace || state.workspace._id !== action.payload._id)
        state.currCollectionId = action.payload.collections[0]._id;
      state.workspace = action.payload;
    },
    setRule: (state, action) => {
      const { ruleIndex, rule } = action.payload;
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      collection.rules[ruleIndex] = rule;
    },
    setRules: (state, action) => {
      const { rules } = action.payload;
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      collection.rules = rules;
    },
    setCurrImageId: (state, action) => {
      state.currImageId = action.payload;
    },
    setStatistics: (state, action) => {
      const statistics = action.payload;
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      collection.statistics = statistics;
    },
    setCurrCollectionId: (state, action) => {
      state.currCollectionId = action.payload;
    },
    setAuthed: (state, action) => {
      state.authed = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = action.payload;
    },
    setFilterImages: (state, action) => {
      state.filterImages = action.payload;
    },
    setMode: (state, action) => {
      // find collection
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      collection.method = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setImageMetaData: (state, action) => {
      const { imgId, data } = action.payload;
      // find collection
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      // update image
      let indexI = collection.images.findIndex(
        (img) => img.imageId.toString() === imgId.toString(),
      );
      if (indexI === -1) {
        console.error("Image not found");
      } else {
        collection.images[indexI] = data;
      }
    },
  },
  extraReducers: (builder) => {
    // #region fetchWorkspace
    builder.addCase(fetchWorkspace.fulfilled, (state, action) => {
      if (!state.workspace || state.workspace._id !== action.payload._id)
        state.currCollectionId = action.payload.collections[0]._id;
      logger.log.collectionName = action.payload.collections[0]._id;
      state.workspace = action.payload;

      const currCollection = action.payload.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      const stats = currCollection ? generateStatus(currCollection) : null;

      logger.log.collectionName = currCollection.name;
      logger.log.workspaceName = action.payload.name;
      logger.currState.startAccuracy = currCollection
        ? currCollection.statistics.accuracy
        : 0;
      logger.currState.startManualRatio = stats
        ? ((stats.manual / stats.total) * 100).toFixed(0)
        : 0;

      state.loading = false;
    });

    builder.addCase(fetchWorkspace.pending, (state) => {
      state.loading = true;
      state.workspace = null;
    });

    builder.addCase(fetchWorkspace.rejected, (state) => {
      state.loading = false;
      state.workspace = null;
    });
    // #endregion

    // #region loadWorkspace
    builder.addCase(loadWorkspace.fulfilled, (state, action) => {
      const data = action.payload;
      if (!state.workspace || state.workspace._id !== action.payload._id)
        state.currCollectionId = action.payload.collections[0]._id;

      logger.log.collectionName = data.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      ).name;
      logger.log.workspaceName = data.name;
      logger.currState.startAccuracy = data.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      ).statistics.accuracy;
      // console.log("startAccuracy", logger.currState.startAccuracy);
      state.workspace = data;
      // update part of the workspace
      state.loading = false;
    });

    builder.addCase(loadWorkspace.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loadWorkspace.rejected, (state) => {
      state.loading = false;
    });
    // #endregion

    // #region loadWorkspacePart
    builder.addCase(loadWorkspacePart.fulfilled, (state, action) => {
      const data = action.payload[0];
      const collectionField = action.payload[1];

      // update part of the workspace
      const collection = state.workspace.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      );
      collection[collectionField] = data.collections.find(
        (c) => c._id.toString() === state.currCollectionId.toString(),
      )[collectionField];

      state.loading = false;
    });

    builder.addCase(loadWorkspacePart.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(loadWorkspacePart.rejected, (state) => {
      state.loading = false;
    });
    // #endregion
  },
});

export const {
  setLoading,
  setRule,
  setRules,
  setWorkspace,
  setCurrImageId,
  setStatistics,
  setCurrCollectionId,
  setAuthed,
  setMode,
  setFilters,
  setFilterImages,
  setImageMetaData,
} = workspcaeSlice.actions;
export default workspcaeSlice.reducer;

import { configureStore } from "@reduxjs/toolkit";
import workspaceReducer from "./workspace";
import workstationReducer from "./workstation";

export default configureStore({
  reducer: {
    workspace: workspaceReducer,
    workstation: workstationReducer,
  },
});

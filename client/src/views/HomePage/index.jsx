import { Box } from "@mui/material";
import { Header } from "./Header";
import { Body } from "./Body";
import { adjustedScrollbar } from "../../muiStyles";
import { fetchWorkspace, setFilterImages } from "../../stores/workspace";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { findCollection } from "../../utils/workspace";
import { filterAndSortImages } from "../../utils/images";

export const HomePage = () => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace.workspace);
  const filters = useSelector((state) => state.workspace.filters);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const collection = findCollection(workspace, currCollectionId);

  useEffect(() => {
    if (!workspace) {
      // alert("load workspace");
      dispatch(fetchWorkspace());
    }
  });

  useEffect(() => {
    if (collection) {
      const result = filterAndSortImages(collection, filters);
      dispatch(setFilterImages(result));
    }
  }, [filters, collection]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        bgcolor: "bg.main",
      }}
    >
      <Header />
      <Body />
    </Box>
  );
};

import { StatusBar } from "../../../../../components";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Canvas } from "./Canvas/Canvas";
import { Toolbar } from "./Toolbar";
import { Carousel } from "./Carousel";
import { useSelector, useDispatch } from "react-redux";
import { findCollection } from "../../../../../utils/workspace";
import {
  setImageMetaData,
  setStatistics,
} from "../../../../../stores/workspace";
import {
  updateImageMetaData,
  updateStatistics,
} from "../../../../../apis/workspace";
import {
  setManual,
  setCurrentInput,
  setViewPred,
} from "../../../../../stores/workstation";
import { setFilters } from "../../../../../stores/workspace";
import { logger } from "../../../../../utils/logger";
import { getImageType } from "../../../../../utils/images";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export const Annotation = ({
  setPage,
  allLabels,
  setAllLabels,
  imgPurgeInfo,
  setImgPurgeInfo,
}) => {
  const dispatch = useDispatch();
  const currentImage = useSelector((state) => state.workstation.currentImage);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const visibility = useSelector((state) => state.workstation.viewPred);
  const imageMetaData = currCollection
    ? currCollection.images.find((image) => image.imageId === currentImage)
    : null;
  const currentLabels = useSelector((state) => state.workstation.currentLabels);
  const manual = useSelector((state) => state.workstation.manual);
  const filters = useSelector((state) => state.workspace.filters);
  const currentTool = useSelector((state) => state.workstation.currentTool);
  const [selectedId, setSelectId] = useState(null);

  const saveLabels = () => {
    let temp = JSON.parse(JSON.stringify(imageMetaData));
    let statistic = JSON.parse(JSON.stringify(currCollection.statistics));

    /* Update labels/image metadata */
    if (manual === true) {
      let oldType = imageMetaData.labeled
        ? imageMetaData.manual
          ? "manual"
          : "autoLabeled"
        : "unlabeled";
      if (currentTool === "text") {
        /* classification */
        temp.labels = [{ name: [currentLabels], confirmed: true }];
      } else {
        /* detection/segmetation */
        const labels = [];
        for (const annotation of allLabels) {
          labels.push({
            name: [annotation.name],
            canvasId: annotation.id,
            confirmed: true,
            mark: {
              x: annotation.x,
              y: annotation.y,
              width: annotation.width,
              height: annotation.height,
            },
          });
        }
        temp.labels = labels;
      }
      temp.labeled = true;
      temp.manual = true;
      statistic[oldType]--;
      statistic.manual++;
      dispatch(setStatistics(statistic));
      updateStatistics(currCollectionId, statistic).catch((err) => {
        console.log(err);
      });
      dispatch(setImageMetaData({ imgId: currentImage, data: temp }));
      updateImageMetaData(currCollectionId, currentImage, temp).catch((err) => {
        console.log(err);
      });
    }
    dispatch(setCurrentInput(""));
    dispatch(setFilters({ ...filters, label: "" }));
    setPage(0);
    logger.currAction.endType = getImageType(imageMetaData);
    logger.currAction.endLabel =
      currentLabels === "" ? "unlabeled" : currentLabels;
    logger.recordCurrAction();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        height: "100%",
        width: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        overflowX: "hidden",
        // border: '3px solid blue',
      }}
    >
      {/* StatusBar */}
      <Box
        sx={{
          display: "flex",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          // border: '3px solid red',
        }}
      >
        <StatusBar />
      </Box>
      {/* Title Bar */}
      <Box
        sx={{
          mt: "13px",
          display: "flex",
          width: "100%",
          backgroundColor: "white",
          borderRadius: "5px",
          p: "4px 0",
        }}
      >
        <Box
          sx={{
            flexBasis: "10%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconButton onClick={saveLabels}>
            <svg
              width="21"
              height="21"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 10.4848L15.3153 1.61688L15.3153 19.3527L0 10.4848Z"
                fill="#04128D"
              />
            </svg>
          </IconButton>
        </Box>
        <Box
          sx={{
            flexBasis: "90%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: "700",
              fontSize: "14px",
              lineHeight: "26px",
            }}
          >
            {imageMetaData.name}
          </Typography>

          {imgPurgeInfo.enable && (
            <FormControlLabel
              label="purge"
              sx={{ ml: "10px" }}
              control={
                <Checkbox
                  color="warning"
                  checked={imgPurgeInfo.markedImgs
                    .map((i) => i.id)
                    .includes(imageMetaData.imageId)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setImgPurgeInfo({
                        ...imgPurgeInfo,
                        dataset: currCollection.name,
                        markedImgs: [
                          ...imgPurgeInfo.markedImgs,
                          {
                            id: imageMetaData.imageId,
                            name: imageMetaData.name,
                          },
                        ],
                      });
                    } else {
                      setImgPurgeInfo({
                        ...imgPurgeInfo,
                        markedImgs: imgPurgeInfo.markedImgs.filter(
                          (img) => img.id !== imageMetaData.imageId,
                        ),
                      });
                    }
                  }}
                  inputProps={{ "aria-label": "controlled" }}
                />
              }
            />
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: 35,
            height: 35,
            mr: 5,
            p: 0.5,
            borderRadius: 10,
            backgroundColor: "transparent",
            "&:hover": {
              backgroundColor: "bg.main",
              opacity: [0.9, 0.9, 0.7],
            },
          }}
          onClick={() => {
            dispatch(setViewPred(!visibility));
          }}
        >
          {visibility ? (
            <VisibilityOffIcon fontSize="large" color="primary" />
          ) : (
            <VisibilityIcon fontSize="large" color="primary" />
          )}
        </Box>
      </Box>
      {/* Canvas Section */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: "bg.canvas",
          // border: "3px solid blue",
          m: "5px 0 5px 0",
          p: "10px 0 10px 0",
        }}
      >
        {/* ToolBar */}
        {/* <Box
          sx={{
            flexBasis: "4%",
            flexGrow: "0",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box",
            // border: "3px solid red",
            // p: '0 10px 0 0',
            justifyContent: "center",
          }}
        >
          <Toolbar />
        </Box> */}
        {/* Canvas */}
        <Box
          sx={{
            flexGrow: "0",
            flexBasis: "100%",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "center",
            // border: "3px solid red",
            overflow: "hidden",
          }}
        >
          <Canvas
            allLabels={allLabels}
            setAllLabels={setAllLabels}
            selectedId={selectedId}
            setSelectId={setSelectId}
          />
        </Box>
      </Box>
      {/* Carousel */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
        }}
      >
        <Carousel
          allLabels={allLabels}
          setAllLabels={setAllLabels}
          selectedId={selectedId}
          setSelectId={setSelectId}
        />
      </Box>
    </Box>
  );
};

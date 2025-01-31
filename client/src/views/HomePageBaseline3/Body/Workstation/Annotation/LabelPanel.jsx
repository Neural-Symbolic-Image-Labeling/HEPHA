import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography
} from "@mui/material";
import { Fragment, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  requestBaselineLabel,
  updateImageMetaData,
  updateStatistics
} from "../../../../../apis/workspace";
import { PaperFrame } from "../../../../../components";
import { GlobalAlertContext } from "../../../../../components/GlobalAlertProvider";
import { generateStatus } from "../../../../../components/StatusBar";
import { useMyBlocklyWorkspace } from "../../../../../context/BlocklyWorkspaceContext";
import { adjustedScrollbar, colorPicker } from "../../../../../muiStyles";
import {
  loadWorkspace,
  setImageMetaData,
  setStatistics,
} from "../../../../../stores/workspace";
import { setCurrentLabels, setManual } from "../../../../../stores/workstation";
import { getImageType } from "../../../../../utils/images";
import { logger } from "../../../../../utils/logger";
import { findCollection } from "../../../../../utils/workspace";

export const LabelPanel = () => {
  const currImgId = useSelector((state) => state.workstation.currentImage);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const imageMetaData = currCollection
    ? currCollection.images.find(
      (img) => img.imageId.toString() === currImgId.toString(),
    )
    : null;
  const mode = currCollection ? currCollection.method : "";

  const getPanel = () => {
    switch (mode) {
      case "Classification":
        return <ClassificationPanel imageMetaData={imageMetaData} />;
      case "Segmentation":
        return <SegmentationPanel imageMetaData={imageMetaData} />;
      default:
        return <ClassificationPanel imageMetaData={imageMetaData} />;
    }
  };

  return (
    <PaperFrame
      sx={{
        alignItems: "center",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        minWidth: "0",
        width: "100%",
        // border: '3px solid red',
      }}
    >
      {imageMetaData && getPanel()}
      {/* {imageMetaData && JSON.stringify(imageMetaData)} */}
    </PaperFrame>
  );
};

const ClassificationPanel = ({ imageMetaData }) => {
  const currImgId = useSelector((state) => state.workstation.currentImage);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const labelOptions = currCollection ? currCollection.labelOptions : [];
  const { setAlert } = useContext(GlobalAlertContext);
  const dispatch = useDispatch();
  const currentLabels = useSelector((state) => state.workstation.currentLabels);
  const enableAL = useSelector((state) => state.workstation.enableAL);

  const { getCurrentRuleJSON } = useMyBlocklyWorkspace();
  const manual = useSelector((state) => state.workstation.manual);

  const [autoLabelButtonDisabled, setAutoLabelButtonDisabled] = useState(false);

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
      temp.labels = [{ name: [currentLabels], confirmed: true }];
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
    // dispatch(setFilters({ ...filters, label: "" }));
    // setPage(0);
    logger.currAction.endType = getImageType(imageMetaData);
    logger.currAction.endLabel =
      currentLabels === "" ? "unlabeled" : currentLabels;
    logger.recordCurrAction();
  };

  const handleAutoLabel = () => {
    saveLabels();

    logger.currState.rules.endRule = {};
    logger.currState.endAccuracy = currCollection
      ? currCollection.statistics.accuracy
      : 0;
    const stats = currCollection ? generateStatus(currCollection) : null;
    logger.currState.endManualRatio = stats
      ? ((stats.manual / stats.total) * 100).toFixed(0)
      : 0;
    logger.currState.finishedAt = new Date().toISOString();
    // logger.currState.snapshot = workspace;
    logger.recordCurrState();
    logger.syncLogs(
      (res) => { },
      (err) => {
        console.log(err);
        setAlert({
          open: true,
          severity: "error",
          message: "Failed to sync logs. Error: " + err.response.data.msg,
        });
      },
    );

    setAutoLabelButtonDisabled(true);
    requestBaselineLabel(
      workspace._id,
      currCollectionId,
      currCollection.method,
      currCollection.type,
      "resnet18",
    )
      .then(() => {
        dispatch(loadWorkspace(workspace.name))
          .then(() => setAutoLabelButtonDisabled(false))
          .catch((err) => {
            console.log(err);
            setAlert({
              open: true,
              severity: "error",
              message: "Failed to load workspace",
            });

            setAutoLabelButtonDisabled(false);
          });
      })
      .then(() => {

        setAutoLabelButtonDisabled(false);
        setAlert({
          open: true,
          severity: "success",
          message: "Auto label success!",
        });
      })
      .catch((err) => {
        console.log(err);
        setAlert({
          open: true,
          severity: "error",
          message: "Failed to auto label. Error: " + err.response.data.msg,
        });

        setAutoLabelButtonDisabled(false);
      });
  };

  const detectMode = (label) => {
    if (!imageMetaData.labels || imageMetaData.labels.length <= 0) {
      return "unlabeled";
    }
    const currLabelList = imageMetaData.labels[0].name;
    if (!currLabelList.includes(label)) {
      return "unlabeled";
    }
    if (currLabelList.length === 1) {
      if (imageMetaData.labels[0].confirmed) {
        // manually confirmed
        return "manual";
      }
      // not confirmed but FOIL has only one prediction
      return "unconfirmed";
    }
    // not confirmed and FOIL has conflict
    return "conflict";
  };

  const handleClick = (label) => {
    let temp = JSON.parse(JSON.stringify(imageMetaData));
    // build label list if first time
    if (!temp.labels || temp.labels.length <= 0) {
      temp.labels = [
        {
          name: [],
          confirmed: false,
        },
      ];
    }
    // update imageMetaData
    temp.labels[0].confirmed = true;
    temp.labels[0].name = [label];
    temp.labeled = true;
    temp.manual = true;
    dispatch(setImageMetaData({ imgId: currImgId, data: temp }));
    dispatch(setCurrentLabels(label));
    // notify sync required
    dispatch(setManual(true));
  };

  return (
    <Fragment>
      <Typography
        sx={{
          mr: "8px",
          boxSizing: "border-box",
          color: "purple.dark",
          fontWeight: "bold",
          fontSize: "18px",
          lineHeight: "19px",
          whiteSpace: "nowrap",
        }}
      >
        Image Label:
      </Typography>
      <Box
        sx={{
          // whiteSpace: 'nowrap',
          backgroundColor: "white",
          borderRadius: "5px",
          boxSizing: "border-box",
          p: "2px 10px",
          minWidth: "0",
          width: "70%",
          // border: '2px solid red',
        }}
      >
        <Box
          sx={{
            boxSizing: "border-box",
            minHeight: "33px",
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            minWidth: "0",
            ...adjustedScrollbar.thin,
          }}
        >
          {labelOptions.length <= 0
            ? null
            : labelOptions.map((label, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mr: "10px",
                }}
              >
                {/* {index !== 0 && (
                <Typography sx={{
                  ml: '10px',
                  mr: '10px',
                  fontWeight: '700',
                  fontSize: '18px',
                  lineHeight: '26px',
                  letterSpacing: '0.15px',
                }}>
                  OR
                </Typography>
              )} */}
                <LabelChipItem
                  label={label}
                  mode={detectMode(label)}
                  handleClick={handleClick}
                />
              </Box>
            ))}
        </Box>
      </Box>
      <Box
        sx={{
          borderRadius: "5px",
          boxSizing: "border-box",
          p: "2px 10px",
          ml: "auto",
          minWidth: "0",
        }}
      >
        <Button
          variant="contained"
          size="medium"
          onClick={() => handleAutoLabel()}
          disabled={autoLabelButtonDisabled || !workspace}
          sx={{
            bgcolor: "purple.dark",
            color: "white",
          }}
        >
          {autoLabelButtonDisabled ? (
            <CircularProgress size={23} />
          ) : (
            "Auto Label"
          )}
        </Button>
      </Box>
    </Fragment>
  );
};

const SegmentationPanel = ({ imageMetaData }) => {
  const currImgId = useSelector((state) => state.workstation.currentImage);
  // get
  const indexL = useSelector((state) => state.workstation.selectIndex);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const dispatch = useDispatch();

  const detectLabelMode = (label) => {
    if (label.confirmed) {
      return "manual";
    } else {
      if (label.name.length > 1) {
        return "conflict";
      } else {
        return "unlabeled";
      }
    }
  };

  const handleClick = (indexN) => {
    let temp = JSON.parse(JSON.stringify(imageMetaData));
    // only keep indexN-th label
    const newLabelName = temp.labels[indexL].name.filter(
      (_, index) => index === indexN,
    );
    temp.labels[indexL].confirmed = true;
    // update imageMetaData
    temp.labels[indexL].name = newLabelName;
    if (
      temp.labels.reduce((pre, curr) => pre.confirmed && curr.confirmed, true)
    ) {
      temp.labeled = true;
      temp.manual = true;
    }
    dispatch(setImageMetaData({ imgId: currImgId, data: temp }));
    dispatch(setCurrentLabels(newLabelName[0]));
    // notify sync required
    dispatch(setManual(true));
  };

  return (
    <Fragment>
      <Typography
        sx={{
          mr: "8px",
          boxSizing: "border-box",
          color: "purple.dark",
          fontWeight: "bold",
          fontSize: "18px",
          lineHeight: "19px",
          whiteSpace: "nowrap",
        }}
      >
        Image Classes:
      </Typography>
      <Box
        sx={{
          // whiteSpace: 'nowrap',
          backgroundColor: "white",
          borderRadius: "5px",
          boxSizing: "border-box",
          p: "2px 10px",
          // border: '2px solid red',
          minWidth: "0",
          width: "100%",
        }}
      >
        <Box
          sx={{
            boxSizing: "border-box",
            minWidth: "0",
            minHeight: "33px",
            display: "flex",
            alignItems: "center",
            overflowX: "auto",
            ...adjustedScrollbar.thin,
          }}
        >
          {!imageMetaData.labels[indexL] || imageMetaData.labels.length <= 0
            ? null
            : imageMetaData.labels[indexL].name.map((label, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {index !== 0 && (
                  <Typography
                    sx={{
                      ml: "10px",
                      mr: "10px",
                      fontWeight: "700",
                      fontSize: "18px",
                      lineHeight: "26px",
                      letterSpacing: "0.15px",
                    }}
                  >
                    OR
                  </Typography>
                )}
                <LabelChipItem
                  label={label}
                  indexN={index}
                  mode={detectLabelMode(imageMetaData.labels[indexL])}
                  handleClick={handleClick}
                />
              </Box>
            ))}
        </Box>
      </Box>
    </Fragment>
  );
};

const LabelChipItem = ({ label, handleClick, mode }) => {
  const clickHandler = () => {
    if (mode === "manual") return;
    handleClick(label);
  };

  const getConfig = () => {
    const config = {
      icon: <SmartToyOutlinedIcon sx={{ color: colorPicker.auto }} />,
      clickable: true,
      sx: {
        bgcolor: "rgba(102, 102, 102, 0.07)",
        color: "rgba(102, 102, 102, 1)",
        "&:hover": {
          cursor: "pointer",
          bgcolor: "rgba(102, 102, 102, 0.67)",
          color: "white",
        },
      },
    };
    switch (mode) {
      case "manual":
        config.icon = null;
        config.clickable = false;
        config.sx.bgcolor = colorPicker.manual;
        config.sx.color = "white";
        config.sx["&:hover"].cursor = "default";
        config.sx["&:hover"].bgcolor = colorPicker.manual;
        break;
      case "unlabeled":
        config.icon = null;
        break;
      default:
        break;
    }
    return config;
  };

  const labelConfig = getConfig();

  return (
    <Fragment>
      <Chip
        size="small"
        label={label}
        icon={labelConfig.icon}
        // avatar={mode === 'manual' ? null : <Avatar alt="FOIL" src="/bot-avatar.png" />}
        onClick={clickHandler}
        clickable={labelConfig.clickable}
        sx={labelConfig.sx}
      />
    </Fragment>
    // <Box
    //   sx={{
    //     display: 'flex',
    //     alignItems: 'center',
    //     justifyContent: 'center',
    //     p: '0 24px',
    //     m: '2px 0',
    //     backgroundColor: 'white',
    //     borderRadius: '5px',
    //     maxWidth: '150px',
    //     border: getBorderStyle(),
    //     '&:hover': {
    //       cursor: mode === 'confirmed' ? 'default' : 'pointer',
    //       backgroundColor: mode === 'confirmed' ? 'white' : 'bg.main',
    //     },
    //   }}
    //   onClick={clickHandler}
    // >
    //   {/* {`Mode: ${mode}; Border: ${getBorderStyle()}`} */}
    //   <Typography sx={{
    //     fontSize: '17px',
    //     lineHeight: '26px',
    //     letterSpacing: '0.15px',
    //     wordBreak: 'keep-all',
    //     whiteSpace: 'nowrap',
    //     textOverflow: 'ellipsis',
    //     overflow: 'hidden',
    //   }}>
    //     {label}
    //   </Typography>
    // </Box>
  );
};

import {
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  DialogActions,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Collections, Search } from "@mui/icons-material";
import {
  loadWorkspace,
  loadWorkspacePart,
  setCurrCollectionId,
  setFilters,
  setMode,
} from "../stores/workspace";
import { useDispatch, useSelector } from "react-redux";
import { Fragment, useEffect, useState, useMemo, useContext } from "react";
import { getAllSetNames } from "../apis/image";
import { PaperFrame } from "./PaperFrame";
import {
  requestAutoLabel,
  requestNewCollection,
  updateMode,
} from "../apis/workspace";
import { findCollection } from "../utils/workspace";
import {
  setActionType,
  setEnableAL,
  setImageListScrollTop,
} from "../stores/workstation";
import { logger } from "../utils/logger";
import { GlobalAlertContext } from "./GlobalAlertProvider";
import { calculateAccuracy } from "../utils/images";
import { generateStatus } from "./StatusBar";
import { useMyBlocklyWorkspace } from "../context/BlocklyWorkspaceContext";

export const TopActionBar = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [imgSets, setImgSets] = useState([]);
  const [loadSets, setLoadSets] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [autoLabelButtonDisabled, setAutoLabelButtonDisabled] = useState(false);
  const enableAL = useSelector((state) => state.workstation.enableAL);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const mode = currCollection ? currCollection.method : null;
  const filters = useSelector((state) => state.workspace.filters);

  const { getCurrentRuleJSON } = useMyBlocklyWorkspace();

  const { setAlert } = useContext(GlobalAlertContext);

  useEffect(() => {
    getAllSetNames().then((sets) => {
      setImgSets(sets);
      setLoadSets(false);
    });
  }, []);

  const handleModeSelect = (e) => {
    // request db change
    updateMode(currCollectionId, e.target.value)
      .then(() => {
        // update store
        dispatch(setMode(e.target.value));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleAutoLabel = () => {
    // log current state before auto label
    logger.currState.rules.endRule = currCollection.rules;
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
      (res) => {},
      (err) => {
        console.log(err);
        setAlert({
          open: true,
          severity: "error",
          message: "Failed to sync logs. Error: " + err.response.data.msg,
        });
      },
    );

    // generate rule JSON
    const newRules = getCurrentRuleJSON();
    setAutoLabelButtonDisabled(true);

    // request auto label
    requestAutoLabel(
      workspace._id,
      currCollectionId,
      currCollection.method,
      newRules,
      currCollection.type,
      enableAL,
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

  return (
    <Fragment>
      <ImageSetSelectionModal
        imgSets={imgSets}
        openModal={openModal}
        setOpenModal={setOpenModal}
      />
      <PaperFrame
        sx={{
          justifyContent: "space-evenly",
          alignItems: "center",
          width: "100%",
          padding: "16px 0 16px 0",
        }}
      >
        {/* Left Button */}
        <Button
          variant="contained"
          disabled={loadSets || !workspace}
          onClick={() => setOpenModal(true)}
          size="medium"
          sx={{
            bgcolor: "purple.dark",
            color: "white",
          }}
        >
          Load Images
        </Button>
        {/* Search Bar */}
        <Box
          sx={{
            display: "flex",
          }}
        >
          <TextField
            variant="outlined"
            // size="small"
            placeholder="Search label name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "purple.dark" }} />
                </InputAdornment>
              ),
              style: {
                height: "33px",
              },
            }}
            sx={{
              width: "250px",
              height: "33px",
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value === "") {
                dispatch(setFilters({ ...filters, label: "" }));
              }
            }}
          />
          <Button
            variant="contained"
            size="medium"
            onClick={() =>
              dispatch(setFilters({ ...filters, label: searchTerm }))
            }
            sx={{
              height: "33px",
              marginLeft: "5px",
              bgcolor: "purple.dark",
              color: "white",
            }}
          >
            Search
          </Button>
        </Box>
        {/* Mode Dropdown */}
        {
          // mode && (
          //   <Box sx={{
          //     height: "33px",
          //     display: "flex",
          //     alignItems: "center",
          //     justifyContent: "center",
          //   }}>
          //     {/* <FormControl fullWidth size="small">
          //     <InputLabel>Mode</InputLabel> */}
          //     <Select
          //       value={mode}
          //       size="small"
          //       label="Mode"
          //       onChange={handleModeSelect}
          //       sx={{
          //         height: "33px",
          //       }}
          //     >
          //       <MenuItem value="Classification">Classification</MenuItem>
          //       <MenuItem value="Segmentation">Segmentation</MenuItem>
          //       <MenuItem value="Detection">Detection</MenuItem>
          //     </Select>
          //     {/* </FormControl> */}
          //   </Box>
          // )
        }
        {/* <Button
          variant="contained"
          size="medium"
          onClick={() => handleBaselineLabel()}
          disabled={baselineLabelBtnDisabled || !workspace}
          sx={{
            bgcolor: '#66ccff',
            color: 'black',
          }}
        >
          {baselineLabelBtnDisabled ? <CircularProgress /> : "Baseline Label"}
        </Button> */}

        {/* Right Button */}
        <FormControlLabel
          control={
            <Checkbox
              sx={{ color: "purple.dark" }}
              checked={enableAL === null ? true : enableAL}
              onChange={(e) => dispatch(setEnableAL(e.target.checked))}
            />
          }
          label="Active Learning"
          sx={{ mr: "0px", ml: "0px" }}
        />

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
      </PaperFrame>
    </Fragment>
  );
};

const ImageSetSelectionModal = ({ imgSets, openModal, setOpenModal }) => {
  const dispatch = useDispatch();
  // const currCollectionId = useSelector(state => state.gallery.currCollectionId);
  const workspace = useSelector((state) => state.workspace.workspace);
  const [seletedSet, setSeletedSet] = useState("");

  const { setAlert } = useContext(GlobalAlertContext);

  const handleLoadSet = async () => {
    if (seletedSet === "") return;
    setAlert({
      open: true,
      severity: "info",
      message: "Loading image set, please wait...",
    });
    // collection already exists
    dispatch(setImageListScrollTop(0));
    let targetCollection = workspace.collections.find(
      (c) => c.name === seletedSet,
    );
    if (targetCollection) {
      dispatch(setCurrCollectionId(targetCollection._id));
      setOpenModal(false);
      setAlert({
        open: true,
        severity: "success",
        message: "Image Set Loaded!",
      });
      return;
    }
    try {
      // request for new collection
      const newCollectionId = await requestNewCollection(
        seletedSet,
        workspace._id,
      );
      // update workspace
      dispatch(loadWorkspace(workspace.name));
      // set curr collection id
      dispatch(setCurrCollectionId(newCollectionId));
      setOpenModal(false);
      setAlert({
        open: true,
        severity: "success",
        message: "Image Set Loaded!",
      });
      return;
    } catch (err) {
      console.log(err);
      setAlert({
        open: true,
        severity: "error",
        message: "Failed to load image set. Error: " + err.response.data.msg,
      });
    }
  };

  return (
    <Dialog onClose={() => setOpenModal(false)} open={openModal}>
      <DialogTitle>Select An Image Set</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          <List component="nav">
            {imgSets.map((set, index) => (
              <ListItemButton
                key={index}
                selected={set === seletedSet}
                onClick={() => setSeletedSet(set)}
              >
                <ListItemIcon>
                  <Collections />
                </ListItemIcon>
                <ListItemText primary={set} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={() => setOpenModal(false)}>
          Cancel
        </Button>
        <Button variant="outlined" onClick={() => handleLoadSet()}>
          Load
        </Button>
      </DialogActions>
    </Dialog>
  );
};

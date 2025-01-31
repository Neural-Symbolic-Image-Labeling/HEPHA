import { SmartToy } from "@mui/icons-material";
import {
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import { Box } from "@mui/system";
import { Fragment, useContext, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GlobalAlertContext } from "../../components/GlobalAlertProvider";
import { loadWorkspace } from "../../stores/workspace";
import { logger } from "../../utils/logger";

const navigations = [
  { title: "Tutorial", link: "/tutorial" },
  { title: "About", link: "/about" },
  { title: "Contact", link: "/contact" },
];

export const Header = () => {
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);

  const { setAlert } = useContext(GlobalAlertContext);

  return (
    <Fragment>
      <LoadWorkspaceModal openModal={openModal} setOpenModal={setOpenModal} />
      <AppBar
        position="static"
        elevation={0}
        sx={{
          color: "white",
          bgcolor: "rgba(90, 106, 191, 1)",
        }}
      >
        <Toolbar variant="dense">
          <SmartToy />
          <Box sx={{ flexBasis: "50%", display: "flex", alignItems: "center" }}>
            <Typography
              // variant="h6"
              sx={{
                marginLeft: "10px",
                fontSize: "18px",
                // fontStyle: "italic",
              }}
            >
              HEPHA
            </Typography>
          </Box>
          {/* <Button onClick={() => setAlert({
            open: true,
            severity: "success",
            message: "This is a success alert!",
          })}>
            Show alert
          </Button> */}
          <Box
            sx={{
              flexBasis: "50%",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Button
              size="small"
              variant="outlined"
              sx={{
                borderColor: "white",
                mr: "10px",
                color: "white",
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
              onClick={() => setOpenModal(true)}
            >
              Workspace
            </Button>
            {navigations.map((link, index) => (
              <Button
                key={index}
                onClick={() => navigate(link.link)}
                variant="text"
                sx={{
                  color: "white",
                  fontSize: "13px",
                  fontWeight: "400 !important",
                }}
              >
                {link.title}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
    </Fragment>
  );
};

const LoadWorkspaceModal = ({ openModal, setOpenModal }) => {
  const [workspaceName, setWorkspaceName] = useState("");
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.workspace.loading);

  const loadWorkspaceAction = () => {
    logger.initLogger();
    new Promise((resolve, reject) => {
      dispatch(loadWorkspace(workspaceName));
      resolve();
    }).then(() => setOpenModal(false));
  };

  return (
    <div>
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Load Workspace</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter workspace name to load your workspace.
          </DialogContentText>
        </DialogContent>
        <Box sx={{ padding: "24px" }}>
          <TextField
            autoFocus
            margin="dense"
            label="Workspace Name"
            type="text"
            fullWidth
            variant="standard"
            onChange={(e) => setWorkspaceName(e.target.value)}
          />
        </Box>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button disabled={isLoading} onClick={() => loadWorkspaceAction()}>
            Load
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

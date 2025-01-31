import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  TextField,
  Button,
  Alert,
  IconButton,
  FormControl,
  Paper,
  Typography,
  DialogActions,
  Select,
  InputLabel,
  MenuItem,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
} from "@mui/material";
import {
  authDashboard,
  autoAuth,
  createImageSet,
  deleteAllImages,
  getAllSetNames,
  uploadImage,
  uploadImageSetByJSONFiles,
} from "../../apis/image";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuthed } from "../../stores/workspace";
import { UploadFile, InsertDriveFile } from "@mui/icons-material";
import { Intermediate } from "../../components/Intermediate";

const readerProcess = (file) => {
  return new Promise((resolve, reject) => {
    let fr = new FileReader();
    fr.onload = () => {
      let image = new Image();
      image.onload = () => {
        resolve({
          data: fr.result,
          name: file.name,
          attributes: {
            height: image.height,
            width: image.width,
          },
        });
      };
      image.src = fr.result;
    };
    fr.onerror = () => {
      reject(fr.error);
    };

    fr.readAsDataURL(file);
  });
};

export const DashboardPage = () => {
  const dispatch = useDispatch();
  const authed = useSelector((state) => state.workspace.authed);
  const [openAuthModal, setOpenAuthModal] = useState(false);
  const [openNotifyModal, setOpenNotifyModal] = useState(false);
  const [openAddImgSetByJSONModel, setOpenAddImgSetByJSONModel] =
    useState(false);
  const [imageSetNameList, setImageSetNameList] = useState([]);
  const [imageSetName, setImageSetName] = useState("");
  const [createImageSetName, setCreateImageSetName] = useState("");
  const [notifyData, setNotifyData] = useState({
    variant: "primary",
    title: "",
    content: "",
  });
  const [images, setImages] = useState([]);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    autoAuth()
      .then((res) => {
        dispatch(setAuthed(true));
        getAllSetNames().then((res) => {
          setImageSetNameList(res);
        });
      })
      .catch((err) => {
        if (!authed) {
          setOpenAuthModal(true);
        }
      });
  }, []);

  useEffect(() => {
    if (imageSetNameList.length > 0) {
      setImageSetName(imageSetNameList[0]);
    }
  }, [imageSetNameList]);

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  const handleImageRead = async (e) => {
    if (!e.target.files) {
      return;
    }
    setWaiting(true);
    const readers = [];

    for (let i = 0; i < e.target.files.length; i++) {
      readers.push(readerProcess(e.target.files[i]));
    }

    const results = await Promise.all(readers);
    setImages(images.concat(results));
    setWaiting(false);

    // setNotifyData({
    //   variant: "success",
    //   title: "Images added",
    //   content: "Images added successfully, you can upload by clicking the upload button.",
    // });
    // setOpenNotifyModal(true);
  };

  const handleImageUpload = async () => {
    if (images.length <= 0) {
      return;
    }
    setWaiting(true);
    for (let i = 0; i < images.length; i++) {
      await uploadImage(images[i], imageSetName);
    }
    setImages([]);
    setWaiting(false);

    setNotifyData({
      variant: "success",
      title: "Images uploaded",
      content: "Images uploaded successfully.",
    });
    setOpenNotifyModal(true);
  };

  const handleCreateImageSet = async () => {
    if (createImageSetName === "") return;
    try {
      await createImageSet(createImageSetName);
      const updatedSet = await getAllSetNames();
      setImageSetNameList(updatedSet);
    } catch (e) {
      setNotifyData({
        variant: "error",
        title: "Cannot create image set",
        content: "Duplicate image set name, please try another name.",
      });
      setOpenNotifyModal(true);
      return;
    }
    setNotifyData({
      variant: "success",
      title: "Image set created",
      content: "Image set created successfully.",
    });
    setOpenNotifyModal(true);
  };

  return (
    <Paper sx={{}}>
      <AuthModal openModal={openAuthModal} setOpenModal={setOpenAuthModal} />
      <NotifyModal
        openModal={openNotifyModal}
        setOpenModal={setOpenNotifyModal}
        data={notifyData}
      />
      <AddImgSetByJSONModel
        openModal={openAddImgSetByJSONModel}
        setOpenModal={setOpenAddImgSetByJSONModel}
      />
      {!authed ? (
        <Intermediate>You are not allowed to see this page.</Intermediate>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
          }}
        >
          {/* <Paper sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "760px",
            height: "300px",
          }}>
            <TextField label="New Image Set Name" variant="standard" onChange={e => setCreateImageSetName(e.target.value)} />
            <Button sx={{ ml: '25px' }} variant="contained" onClick={() => handleCreateImageSet()}>Create</Button>
          </Paper>
          <Paper sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "760px",
            height: "300px",
            mt: '15px'
          }}>
            {imageSetNameList.length <= 0 ? <Intermediate>No Image Collection Found</Intermediate> : (
              <>
                <FormControl>
                  <InputLabel>ImageSet</InputLabel>
                  <Select
                    value={imageSetName}
                    label="ImageSet"
                    onChange={(e) => setImageSetName(e.target.value)}
                    sx={{ minWidth: '150px' }}
                  >
                    {imageSetNameList.map(name => (
                      <MenuItem key={name} value={name}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="outlined" component="label" startIcon={<UploadFile />} disabled={waiting} sx={{ mt: "5%" }}>
                  Add Images
                  <input
                    accept="image/*"
                    type="file"
                    multiple
                    id="upload-image-button"
                    hidden
                    onChange={e => handleImageRead(e)}
                  />
                </Button>
                <Button
                  variant="contained"
                  onClick={async () => await handleImageUpload()}
                  sx={{ mt: "5%" }}
                  disabled={waiting}
                >
                  {`Upload (${images.length} images)`}
                </Button>
              </>
            )}
          </Paper> */}
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "760px",
              height: "300px",
              mt: "15px",
            }}
          >
            <Button onClick={() => setOpenAddImgSetByJSONModel(true)}>
              Upload JSON Data
            </Button>
          </Paper>
          <Paper
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "760px",
              height: "300px",
              mt: "15px",
            }}
          >
            <KeyValueRow keyName="Delete All Images">
              <Button
                variant="contained"
                onClick={() => {
                  deleteAllImages().then(() => {
                    getAllSetNames().then((res) => setImageSetNameList(res));
                    setNotifyData({
                      variant: "success",
                      title: "Images deleted",
                      content: "Images deleted successfully.",
                    });
                    setOpenNotifyModal(true);
                  });
                }}
              >
                Delete
              </Button>
            </KeyValueRow>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

const AuthModal = ({ openModal, setOpenModal }) => {
  const dispatch = useDispatch();
  const [token, setToken] = useState("");
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (showError) {
      setTimeout(() => {
        setShowError(false);
      }, 10000);
    }
  }, [showError]);

  const handleSubmit = () => {
    authDashboard(token)
      .then((res) => {
        dispatch(setAuthed(true));
        setOpenModal(false);
      })
      .catch((err) => {
        setShowError(true);
      });
  };

  return (
    <Dialog open={openModal}>
      <DialogTitle>Authentication Required</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You must be admin to view this page.
        </DialogContentText>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            m: "5%",
          }}
        >
          {showError && (
            <Alert
              severity="error"
              sx={{
                width: "80%",
                m: "1%",
              }}
            >
              Invalid token.
            </Alert>
          )}
          <Box
            component="form"
            sx={{
              m: "10px",
            }}
          >
            <TextField
              size="small"
              type="password"
              required
              label="Token"
              defaultValue=""
              onChange={(e) => setToken(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={() => navigate("/")}>
          Go back
        </Button>
        <Button variant="contained" onClick={() => handleSubmit()}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AddImgSetByJSONModel = ({ openModal, setOpenModal }) => {
  let uploading = false;
  const [imgSetName, setImgSetName] = useState("");
  const [imgSetType, setImgSetType] = useState("Default");
  const [jsonFiles, setJsonFiles] = useState([]);
  const [jsonTestFiles, setJsonTestFiles] = useState([]);

  // add & upload files
  const handleAddFiles = (e) => {
    uploading = true;
    // alert(e.target.files.length)
    setJsonFiles([...jsonFiles, ...e.target.files]);
  };

  const handleAddTestFiles = (e) => {
    uploading = true;
    setJsonTestFiles([...jsonTestFiles, ...e.target.files]);
  };

  const handleUploadFiles = async () => {
    uploading = true;

    try {
      const formData = new FormData();
      formData.append("name", imgSetName);
      formData.append("type", imgSetType);
      for (let i = 0; i < jsonFiles.length; i++) {
        formData.append("files", jsonFiles[i]);
      }
      for (let i = 0; i < jsonTestFiles.length; i++) {
        formData.append("test", jsonTestFiles[i]);
      }
      // upload the combined json object
      alert(`Uploading ${jsonFiles.length} + ${jsonTestFiles.length} files...`);
      await uploadImageSetByJSONFiles(formData);
      //clean up states
      setJsonFiles([]);
      setJsonTestFiles([]);
      setImgSetName("");
      alert(`Uploaded.`);
    } catch (err) {
      alert(`Failed to upload.\n\n` + err.message);
    }

    uploading = false;
  };

  useEffect(() => {
    if (uploading) uploading = false;
  }, [jsonFiles]);

  return (
    <Dialog open={openModal} onClose={() => setOpenModal(false)} scroll="paper">
      <DialogTitle>Add Image Set By JSON file</DialogTitle>
      <DialogContent
        sx={{
          overflowY: "scroll",
          overflowX: "hidden",
        }}
      >
        <DialogContentText>
          Please upload JSON file(s) that represent a dataset.
        </DialogContentText>
        <Box
          sx={{
            width: "40vw",
            height: "70vh",
            boxSizing: "border-box",
            marginTop: "20px",
          }}
        >
          <Grid
            container
            spacing={2}
            justifyContent="flex-start"
            alignItems="center"
          >
            <Grid
              item
              xs={5}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              Give it a name:
            </Grid>
            <Grid item xs={7}>
              <Box
                component="form"
                noValidate
                autoComplete="off"
                sx={{ width: "80%", height: "100%", paddingTop: "5px" }}
              >
                <TextField
                  size="small"
                  label="Name"
                  value={imgSetName}
                  onChange={(e) => setImgSetName(e.target.value)}
                  error={!imgSetName}
                  // helperText={!imgSetName && "Name must no be empty."}
                />
              </Box>
            </Grid>

            <Grid
              item
              xs={5}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              Type of the dataset:
            </Grid>
            <Grid item xs={7}>
              <FormControl size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={imgSetType}
                  label="Type"
                  size="small"
                  autoWidth
                  onChange={(e) => setImgSetType(e.target.value)}
                >
                  <MenuItem value="Default">Default</MenuItem>
                  <MenuItem value="Bird">Bird</MenuItem>
                  <MenuItem value="Medical">Medical</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Data JSON Uploader */}
            <Grid
              item
              xs={5}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              Upload JSON file(s):
            </Grid>
            <Grid item xs={7}>
              <input
                hidden
                accept=".json"
                style={{ display: "none" }}
                id="json-add-file-input"
                multiple
                type="file"
                onChange={handleAddFiles}
              />
              <label htmlFor="json-add-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={uploading}
                >
                  Add file(s)
                </Button>
              </label>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {jsonFiles.length <= 0 && (
                  <Typography variant="body2">No file added.</Typography>
                )}
                {jsonFiles.length > 0 && (
                  <List>
                    {jsonFiles.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar>
                            <InsertDriveFile />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.name}
                          secondary={new Date(file.lastModified).toISOString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>

            {/* Test JSON Uploader */}
            <Grid
              item
              xs={5}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
              Upload Test Set JSON file(s):
            </Grid>
            <Grid item xs={7}>
              <input
                hidden
                accept=".json"
                style={{ display: "none" }}
                id="json-add-test-file-input"
                multiple
                type="file"
                onChange={handleAddTestFiles}
              />
              <label htmlFor="json-add-test-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={uploading}
                >
                  Add file(s)
                </Button>
              </label>
            </Grid>

            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                {jsonTestFiles.length <= 0 && (
                  <Typography variant="body2">No file added.</Typography>
                )}
                {jsonTestFiles.length > 0 && (
                  <List>
                    {jsonTestFiles.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar>
                            <InsertDriveFile />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={file.name}
                          secondary={new Date(file.lastModified).toISOString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Grid>
            {/* Upload */}
            <Grid
              item
              xs={12}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Button
                variant="contained"
                onClick={handleUploadFiles}
                disabled={uploading}
              >
                Upload
              </Button>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/** @param {{data: {variant: "primary" | "error" | "success"; title: string; content: string;}; [x: string]: any}} param0 */
const NotifyModal = ({ openModal, setOpenModal, data }) => {
  const colorPicker = {
    primary: "",
    error: "rgb(255, 51, 0, 0.8)",
    success: "rgb(0, 153, 51, 0.8)",
  };

  return (
    <Dialog open={openModal} onClose={() => setOpenModal(false)}>
      <DialogTitle sx={{ color: colorPicker[data.variant] }}>
        {data.title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{data.content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenModal(false)}>OK</Button>
      </DialogActions>
    </Dialog>
  );
};

const KeyValueRow = ({ keyName, children }) => {
  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        p: "2% 0",
        mb: "15px",
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          pl: "15px",
        }}
      >
        <Typography variant="h7" sx={{ color: "black" }}>
          {keyName}
        </Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          pr: "15px",
        }}
      >
        {children}
      </Box>
    </Paper>
  );
};

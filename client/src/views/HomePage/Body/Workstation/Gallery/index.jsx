import {
  Box,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Typography,
} from "@mui/material";
import { Fragment, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Intermediate,
  LabelItem,
  PaperFrame,
  StatusBar,
} from "../../../../../components";
import { adjustedScrollbar, colorPicker } from "../../../../../muiStyles";
import {
  setCurrentImage,
  setCurrentLabels,
  setManual,
  setCurrentTool,
  setCurrentImageList,
  setImageListScrollTop,
} from "../../../../../stores/workstation";
import {
  getDisplayedImagesMetaData,
  getImageType,
} from "../../../../../utils/images";
import { findCollection } from "../../../../../utils/workspace";
import { TopActionBar } from "../../../../../components/TopActionBar";
import { logger } from "../../../../../utils/logger";
import { RemoveCircle, SmartToy } from "@mui/icons-material";

const iconDict = {
  unlabeled: (
    <svg
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="20" fill="#8E8E8E" />
      <path
        d="M62.2152 4.42416H64.5217V11.5087C64.5217 12.3041 64.3317 13.0002 63.9517 13.5967C63.5753 14.1933 63.048 14.6585 62.3697 14.9923C61.6915 15.3226 60.9013 15.4877 59.9993 15.4877C59.0938 15.4877 58.3019 15.3226 57.6236 14.9923C56.9454 14.6585 56.418 14.1933 56.0416 13.5967C55.6652 13.0002 55.477 12.3041 55.477 11.5087V4.42416H57.7834V11.3116C57.7834 11.7271 57.874 12.0964 58.0551 12.4195C58.2397 12.7427 58.499 12.9966 58.8328 13.1813C59.1666 13.3659 59.5554 13.4583 59.9993 13.4583C60.4468 13.4583 60.8356 13.3659 61.1659 13.1813C61.4997 12.9966 61.7571 12.7427 61.9383 12.4195C62.1229 12.0964 62.2152 11.7271 62.2152 11.3116V4.42416Z"
        fill="white"
      />
    </svg>
  ),
  manual: (
    <svg
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="20" fill="#0BA436" />
      <path
        d="M54.0854 4.42416H56.9298L59.9341 11.7537H60.0619L63.0662 4.42416H65.9106V15.3333H63.6734V8.23275H63.5829L60.7597 15.28H59.2363L56.4131 8.20612H56.3226V15.3333H54.0854V4.42416Z"
        fill="white"
      />
    </svg>
  ),
  conflict: (
    <svg
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="20" fill="#D10000" />
      <path
        d="M64.6397 8.24341H62.3066C62.264 7.94156 62.177 7.67345 62.0456 7.43908C61.9142 7.20115 61.7456 6.99873 61.5396 6.83183C61.3336 6.66493 61.0957 6.53709 60.8258 6.44831C60.5595 6.35953 60.2701 6.31514 59.9576 6.31514C59.3929 6.31514 58.9011 6.45541 58.4821 6.73595C58.063 7.01294 57.7381 7.41777 57.5073 7.95044C57.2765 8.47956 57.161 9.12231 57.161 9.87871C57.161 10.6564 57.2765 11.3098 57.5073 11.8389C57.7417 12.3681 58.0684 12.7676 58.4874 13.0374C58.9064 13.3073 59.3912 13.4423 59.9416 13.4423C60.2505 13.4423 60.5364 13.4014 60.7992 13.3198C61.0655 13.2381 61.3017 13.1191 61.5076 12.9629C61.7136 12.8031 61.8841 12.6095 62.019 12.3823C62.1575 12.155 62.2534 11.8958 62.3066 11.6046L64.6397 11.6152C64.5794 12.1159 64.4285 12.5989 64.187 13.0641C63.949 13.5257 63.6277 13.9394 63.2228 14.3052C62.8216 14.6674 62.3422 14.9551 61.7846 15.1681C61.2307 15.3776 60.6039 15.4824 59.9043 15.4824C58.9313 15.4824 58.0613 15.2622 57.2942 14.8219C56.5307 14.3815 55.927 13.7441 55.4831 12.9096C55.0428 12.0751 54.8226 11.0648 54.8226 9.87871C54.8226 8.68908 55.0463 7.677 55.4938 6.84249C55.9412 6.00797 56.5485 5.37231 57.3155 4.93552C58.0826 4.49518 58.9455 4.27501 59.9043 4.27501C60.5364 4.27501 61.1223 4.36379 61.6621 4.54135C62.2054 4.71891 62.6866 4.97814 63.1057 5.31905C63.5247 5.6564 63.8656 6.07011 64.1284 6.56017C64.3947 7.05023 64.5652 7.61131 64.6397 8.24341Z"
        fill="white"
      />
    </svg>
  ),
  auto: (
    <svg
      width="120"
      height="20"
      viewBox="0 0 120 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="120" height="20" fill="#D95F0E" />
      <path
        d="M56.924 15.3333H54.4524L58.2184 4.42416H61.1907L64.9514 15.3333H62.4798L59.7472 6.91706H59.6619L56.924 15.3333ZM56.7695 11.0453H62.6076V12.8457H56.7695V11.0453Z"
        fill="white"
      />
    </svg>
  ),
};

export const Gallery = ({
  allLabels,
  setAllLabels,
  setPage,
  imgPurgeInfo,
  setImgPurgeInfo,
}) => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const imageListScrollTop = useSelector(
    (state) => state.workstation.imageListScrollTop,
  );
  const filterImages = useSelector((state) => state.workspace.filterImages);
  const isLoading = useSelector((state) => state.workspace.loading);
  const currCollection = findCollection(workspace, currCollectionId);
  const [displayedImages, setDisplayedImages] = useState([]);
  const currentTool = useSelector((state) => state.workstation.currentTool);
  const mode = currCollection ? currCollection.method : null;

  const imageListElementRef = useRef(null);

  useEffect(() => {
    if (imageListElementRef.current && imageListScrollTop !== 0) {
      setTimeout(() => {
        imageListElementRef.current.scrollTo({
          top: imageListScrollTop,
          behavior: "smooth",
        });
      }, 1);
    }
  }, []);

  useEffect(() => {
    if (mode === "Classification") {
      dispatch(setCurrentTool("text"));
    } else {
      dispatch(setCurrentTool("boundingbox"));
    }
  }, [dispatch, mode]);

  useEffect(() => {
    if (currCollection) {
      setDisplayedImages(
        getDisplayedImagesMetaData(currCollection, filterImages),
      );
    }
  }, [filterImages]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        // overflow: "auto",
        // border: "3px solid red",
      }}
    >
      <TopActionBar />
      <Box
        sx={{
          mt: "12px",
          mb: "12px",
        }}
      >
        <StatusBar />
      </Box>
      <PaperFrame
        sx={{
          justifyContent: "center",
          alignItems: "center",
          // p: "0 0 20px 0",
          boxSizing: "border-box",
          // border: "3px solid blue",
          height: "100%",
          minHeight: "0",
        }}
      >
        {isLoading ? (
          <Intermediate>Loading</Intermediate>
        ) : workspace === null ? (
          <Intermediate>No Data</Intermediate>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "0",
              width: "100%",
              maxHeight: "100%",
              height: "100%",
              boxSizing: "border-box",
              // overflowX: "hidden",
              // overflowY: "auto",
              // ...adjustedScrollbar.hidden,
            }}
          >
            <ImageList
              ref={imageListElementRef}
              sx={{
                width: "100%",
                // height: "100%",
                p: "10px",
                overflowX: "hidden",
                overflowY: "auto",
                ...adjustedScrollbar.thin,
                boxSizing: "border-box",
                justifyContent: "center",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(120px, 120px)) !important",
              }}
              rowHeight="auto"
            >
              {displayedImages.length === 0 ? (
                <Intermediate>No Result</Intermediate>
              ) : (
                displayedImages.map((image, index) => (
                  <Fragment key={index}>
                    <ImageListItem
                      sx={{
                        width: "fit-content",
                        height: "fit-content",
                        boxSizing: "border-box",
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "120px",
                          height: "120px",
                          boxSizing: "border-box",
                        }}
                      >
                        {imgPurgeInfo.enable &&
                          imgPurgeInfo.markedImgs
                            .map((i) => i.id)
                            .includes(image.imageId) && (
                            <Box
                              sx={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                              }}
                            >
                              <RemoveCircle sx={{ color: "red" }} />
                            </Box>
                          )}
                        {currCollection.al_imageOrder?.includes(
                          image.imageId,
                        ) && (
                          <Fragment>
                            <Box
                              sx={{
                                position: "absolute",
                                top: "0px",
                                left: "0px",
                                borderLeft: "5px solid transparent",
                                bgcolor: "#66ccff",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <SmartToy
                                sx={{ color: "white" }}
                                fontSize="18px"
                              />
                              <Typography
                                sx={{ color: "white", pl: "3px", pr: "3px" }}
                              >
                                ?
                              </Typography>
                            </Box>
                          </Fragment>
                        )}
                        <Box
                          sx={{
                            position: "absolute",
                            top: "100px",
                            left: "0",
                            // border: "3px solid red",
                          }}
                        >
                          <Box
                            sx={{
                              bgcolor: colorPicker[getImageType(image)],
                              width: "120px",
                              height: "20px",
                              color: "white",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              boxSizing: "border-box",
                            }}
                          >
                            <Box
                              sx={{
                                minWidth: 0,
                                flexBasis: "40%",
                                fontSize: "18px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {`${getImageType(image).charAt(0).toUpperCase()}`}
                            </Box>
                            <Box
                              sx={{
                                minWidth: 0,
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                flexBasis: "60%",
                                fontSize: "14px",
                              }}
                            >
                              {getImageType(image) === "unlabeled"
                                ? ""
                                : `${image.labels[0]?.name[0]}`}
                            </Box>
                          </Box>
                          {/* {iconDict[getImageType(image)]} */}
                        </Box>
                        <Box
                          component="img"
                          sx={{
                            boxSizing: "border-box",
                            // border: currCollection.al_imageOrder?.includes(image.imageId)? "3px solid #66ccff" : "none",
                            objectFit: "cover",
                            width: "120px",
                            height: "120px",
                            // ...borderDict[getType(image)],
                            "&:hover": {
                              cursor: "pointer",
                              opacity: 0.5,
                            },
                          }}
                          src={image.url}
                          alt={image.name}
                          loading="lazy"
                          onClick={() => {
                            dispatch(
                              setImageListScrollTop(
                                imageListElementRef.current.scrollTop,
                              ),
                            );

                            setPage(1);
                            logger.currAction.imageId = image.imageId;
                            logger.currAction.startLabel =
                              image.labels[0] === undefined
                                ? "unlabel"
                                : image.labels[0].name[0];
                            logger.currAction.startType = getImageType(image);
                            dispatch(setCurrentImage(image.imageId));
                            dispatch(setCurrentImageList(filterImages));
                            dispatch(setManual(false));
                            if (mode === "Classification") {
                              dispatch(
                                setCurrentLabels(
                                  image.labels[0] === undefined
                                    ? ""
                                    : image.labels[0].name[0],
                                ),
                              );
                            } else {
                              /* detection/segmetation */
                              const reformatLables = [];
                              for (const item of image.labels) {
                                reformatLables.push({
                                  name: item.name[0],
                                  id: item.canvasId,
                                  x: item.mark.x,
                                  y: item.mark.y,
                                  width: item.mark.width,
                                  height: item.mark.height,
                                });
                              }
                              setAllLabels(reformatLables);
                              dispatch(setCurrentLabels(""));
                            }
                          }}
                        />
                      </Box>
                      {/* <ImageListItemBar
                                      title={<LabelItem type={getType(image)} label={image.name} />}
                                      position="below"
                                    /> */}
                      image
                    </ImageListItem>
                  </Fragment>
                ))
              )}
            </ImageList>
          </Box>
        )}
      </PaperFrame>
    </Box>
  );
};

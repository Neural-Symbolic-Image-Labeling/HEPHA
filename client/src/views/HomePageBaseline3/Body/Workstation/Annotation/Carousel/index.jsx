import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { findCollection } from "../../../../../../utils/workspace";
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from "react-icons/fa";
import { Box, unstable_useId } from "@mui/material";
import style from "./style.module.css";
import {
  setCurrentImage,
  setSelectIndex,
  setViewPred,
} from "../../../../../../stores/workstation";
import {
  setCurrentLabels,
  setCurrentInput,
} from "../../../../../../stores/workstation";
import { setImageMetaData } from "../../../../../../stores/workspace";
import { setManual } from "../../../../../../stores/workstation";
import { setStatistics } from "../../../../../../stores/workspace";
import { PaperFrame } from "../../../../../../components";
import { updateImageMetaData } from "../../../../../../apis/workspace";
import { updateStatistics } from "../../../../../../apis/workspace";
import { loadWorkspace } from "../../../../../../stores/workspace";
import { getDisplayedImagesMetaData } from "../../../../../../utils/images";
import { logger } from "../../../../../../utils/logger";
import { getImageType } from "../../../../../../utils/images";

export const Carousel = ({
  allLabels,
  setAllLabels,
  selectedId,
  setSelectId,
}) => {
  const dispatch = useDispatch();
  const currentImage = useSelector((state) => state.workstation.currentImage);
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const imageMetaData = currCollection
    ? currCollection.images.find((image) => image.imageId === currentImage)
    : null;
  const currentLabels = useSelector((state) => state.workstation.currentLabels);
  const manual = useSelector((state) => state.workstation.manual);
  const currentTool = useSelector((state) => state.workstation.currentTool);
  const [current, setCurrent] = useState();
  const filterImages = useSelector(
    (state) => state.workstation.currentImageList,
  );
  const [displayedImages, setDisplayedImages] = useState([]);

  useEffect(() => {
    if (currCollection) {
      setDisplayedImages(
        getDisplayedImagesMetaData(currCollection, filterImages),
      );
      if (current === undefined) {
        setCurrent(
          getDisplayedImagesMetaData(currCollection, filterImages).findIndex(
            (image) => image.imageId === currentImage,
          ),
        );
      }
    }
  }, [currCollection, current, currentImage, filterImages]);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setWidth]);

  const nextSlide = () => {
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

      /* Update statistic */
      statistic[oldType]--;
      statistic.manual++;
      dispatch(setStatistics(statistic));
      updateStatistics(currCollectionId, statistic).catch((err) => {
        console.log(err);
      });

      /* Update image meta data */
      temp.labeled = true;
      temp.manual = true;
      dispatch(setImageMetaData({ imgId: currentImage, data: temp }));
      updateImageMetaData(currCollectionId, currentImage, temp)
        .then(() => {
          // dispatch(loadWorkspace(workspace.name));
        })
        .catch((err) => {
          console.log(err);
        });
    }

    /* Load next image's data */
    let nextImage =
      displayedImages[current === displayedImages.length - 1 ? 0 : current + 1];
    setCurrent(current === displayedImages.length - 1 ? 0 : current + 1);
    dispatch(setCurrentImage(nextImage.imageId));
    if (currentTool === "text") {
      /* classification */
      dispatch(
        setCurrentLabels(
          nextImage.labels[0] === undefined ? "" : nextImage.labels[0].name[0],
        ),
      );
    } else {
      /* detection/segmetation */
      const reformatLables = [];
      for (const item of nextImage.labels) {
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
      dispatch(setSelectIndex(-1));
      setSelectId(null);
    }
    dispatch(setManual(false));
    dispatch(setCurrentInput(""));
    dispatch(setViewPred(false));
    logger.currAction.endLabel =
      imageMetaData.labels[0] === undefined
        ? "unlabel"
        : imageMetaData.labels[0].name[0];
    logger.currAction.endType = getImageType(imageMetaData);
    logger.recordCurrAction();
    logger.currAction.imageId = nextImage.imageId;
    logger.currAction.startLabel =
      nextImage.labels[0] === undefined
        ? "unlabel"
        : nextImage.labels[0].name[0];
    logger.currAction.startType = getImageType(nextImage);
  };

  const prevSlide = () => {
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

      /* Update statistic */
      statistic[oldType]--;
      statistic.manual++;
      dispatch(setStatistics(statistic));
      updateStatistics(currCollectionId, statistic).catch((err) => {
        console.log(err);
      });

      /* Update image meta data */
      temp.labeled = true;
      temp.manual = true;
      dispatch(setImageMetaData({ imgId: currentImage, data: temp }));
      updateImageMetaData(currCollectionId, currentImage, temp)
        .then(() => {
          dispatch(loadWorkspace(workspace.name));
        })
        .catch((err) => {
          console.log(err);
        });
    }

    /* Load next image's data */
    let prevImage =
      displayedImages[current === 0 ? displayedImages.length - 1 : current - 1];
    setCurrent(current === 0 ? displayedImages.length - 1 : current - 1);
    dispatch(setCurrentImage(prevImage.imageId));
    if (currentTool === "text") {
      /* classification */
      dispatch(
        setCurrentLabels(
          prevImage.labels[0] === undefined ? "" : prevImage.labels[0].name[0],
        ),
      );
    } else {
      /* detection/segmetation */
      const reformatLables = [];
      for (const item of prevImage.labels) {
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
      dispatch(setSelectIndex(-1));
      setSelectId(null);
    }
    dispatch(setManual(false));
    dispatch(setCurrentInput(""));
    dispatch(setSelectIndex(-1));
    dispatch(setViewPred(false));
    logger.currAction.endLabel =
      imageMetaData.labels[0] === undefined
        ? "unlabel"
        : imageMetaData.labels[0].name[0];
    logger.currAction.endType = getImageType(imageMetaData);
    logger.recordCurrAction();
    logger.currAction.imageId = prevImage.imageId;
    logger.currAction.startLabel =
      prevImage.labels[0] === undefined
        ? "unlabel"
        : prevImage.labels[0].name[0];
    logger.currAction.startType = getImageType(prevImage);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.keyCode === 39) {
        nextSlide();
      } else if (event.keyCode === 37) {
        prevSlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [nextSlide, prevSlide]);

  return (
    <PaperFrame
      row
      sx={{
        justifyContent: "space-evenly",
        alignItems: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <FaArrowAltCircleLeft
        className={style["left-arrow"]}
        onClick={prevSlide}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {displayedImages.map((slide, index) => {
          return (
            <div
              className={
                index === current ? style["slide active"] : style["slide"]
              }
              key={index}
            >
              {index === current && displayedImages.length === 1 && (
                <div className={style["container"]}>
                  <img
                    src={slide.url}
                    alt={slide.name}
                    className={style["image"]}
                  />
                </div>
              )}

              {index === current && displayedImages.length === 2 && (
                <div className={style["container"]}>
                  <img
                    src={slide.url}
                    alt={slide.name}
                    className={style["image"]}
                  />

                  <img
                    src={
                      displayedImages.find(
                        (slide) =>
                          displayedImages.indexOf(slide) ===
                          (current === 0
                            ? displayedImages.length - 1
                            : current - 1),
                      ).url
                    }
                    alt={
                      displayedImages.find(
                        (slide) =>
                          displayedImages.indexOf(slide) ===
                          (current === 0
                            ? displayedImages.length - 1
                            : current - 1),
                      ).name
                    }
                    className={style["image_pre"]}
                  />
                </div>
              )}

              {index === current &&
                displayedImages.length >= 3 &&
                displayedImages.length <= 4 && (
                  <div className={style["container"]}>
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className={style["image"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                  </div>
                )}

              {index === current &&
                displayedImages.length >= 5 &&
                width <= 1200 && (
                  <div className={style["container"]}>
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className={style["image"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                  </div>
                )}

              {index === current &&
                displayedImages.length >= 5 &&
                width < 1500 &&
                width >= 1200 && (
                  <div className={style["container"]}>
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className={style["image"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                  </div>
                )}

              {index === current &&
                displayedImages.length >= 5 &&
                displayedImages.length <= 6 &&
                width >= 1500 && (
                  <div className={style["container"]}>
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className={style["image"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                  </div>
                )}

              {index === current &&
                displayedImages.length >= 7 &&
                width >= 1500 && (
                  <div className={style["container"]}>
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 3
                              : current === 1
                                ? displayedImages.length - 2
                                : current === 2
                                  ? displayedImages.length - 1
                                  : current - 3),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 3
                              : current === 1
                                ? displayedImages.length - 2
                                : current === 2
                                  ? displayedImages.length - 1
                                  : current - 3),
                        ).name
                      }
                      className={style["image_pre_pre_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 2
                              : current === 1
                                ? displayedImages.length - 1
                                : current - 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === 0
                              ? displayedImages.length - 1
                              : current - 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={slide.url}
                      alt={slide.name}
                      className={style["image"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 0
                              : current + 1),
                        ).name
                      }
                      className={style["image_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 1
                              : current === displayedImages.length - 2
                                ? 0
                                : current + 2),
                        ).name
                      }
                      className={style["image_pre_pre"]}
                    />
                    <img
                      src={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 2
                              : current === displayedImages.length - 2
                                ? 1
                                : current === displayedImages.length - 3
                                  ? 0
                                  : current + 3),
                        ).url
                      }
                      alt={
                        displayedImages.find(
                          (slide) =>
                            displayedImages.indexOf(slide) ===
                            (current === displayedImages.length - 1
                              ? 2
                              : current === displayedImages.length - 2
                                ? 1
                                : current === displayedImages.length - 3
                                  ? 0
                                  : current + 3),
                        ).name
                      }
                      className={style["image_pre_pre_pre"]}
                    />
                  </div>
                )}
            </div>
          );
        })}
      </Box>
      <FaArrowAltCircleRight
        className={style["right-arrow"]}
        onClick={nextSlide}
      />
    </PaperFrame>
  );
};

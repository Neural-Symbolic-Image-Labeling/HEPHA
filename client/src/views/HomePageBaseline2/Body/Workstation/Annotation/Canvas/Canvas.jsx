import React, { useState, useEffect, useRef, cloneElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Stage, Layer, Line, Label, Tag, Text, Group } from "react-konva";
import { v1 as uuid } from "uuid";
import BoundingBox from "./BoudingBox";
import LoadImage from "./LoadImage";
import Polygon from "./Polygon";
import { findCollection } from "../../../../../../utils/workspace";
import { PaperFrame } from "../../../../../../components";
import {
  Box,
  Typography,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import TextField from "@mui/material/TextField";
import {
  setCurrentLabels,
  setCurrentInput,
  setDeleteLabel,
} from "../../../../../../stores/workstation";
import {
  setManual,
  setSelectIndex,
} from "../../../../../../stores/workstation";
import { LabelPanel } from "../LabelPanel";
import { getDisplayedImagesMetaData } from "../../../../../../utils/images";
import { setImageMetaData } from "../../../../../../stores/workspace";
import { getImageMask } from "../../../../../../apis/image";

export const Canvas = ({
  allLabels,
  setAllLabels,
  selectedId,
  setSelectId,
}) => {
  const dispatch = useDispatch();
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const currDatasetName = currCollection ? currCollection.name : "";
  const currentLabels = useSelector((state) => state.workstation.currentLabels);
  const currentInput = useSelector((state) => state.workstation.currentInput);
  const tool = useSelector((state) => state.workstation.currentTool);
  const currentImage = useSelector((state) => state.workstation.currentImage);
  const filterImages = useSelector(
    (state) => state.workstation.currentImageList,
  );
  const [displayedImages, setDisplayedImages] = useState([]);
  const currentTool = useSelector((state) => state.workstation.currentTool);
  const imageMetaData = currCollection
    ? currCollection.images.find((image) => image.imageId === currentImage)
    : null;
  const [offsetY, setOffsetY] = useState(0);
  const visibility = useSelector((state) => state.workstation.viewPred);

  useEffect(() => {
    if (currCollection) {
      setDisplayedImages(
        getDisplayedImagesMetaData(currCollection, filterImages),
      );
    }
  }, [currCollection, filterImages]);

  const [newAnnotation, setNewAnnotation] = useState([]);
  const selectIndex = useSelector((state) => state.workstation.selectIndex);
  const deleteLabel = useSelector((state) => state.workstation.deleteLabel);

  const [points, setPoints] = useState([]);
  const [flattenedPoints, setFlattenedPoints] = useState();
  const [position, setPosition] = useState([0, 0]);
  const [isMouseOverPoint, setMouseOverPoint] = useState(false);
  const [isPolyComplete, setPolyComplete] = useState(false);
  const getMousePos = (stage) => {
    return [stage.getPointerPosition().x, stage.getPointerPosition().y];
  };
  const [lines, setLines] = useState([]);
  const isDrawing = useRef(false);

  const handleMouseDown = (event) => {
    if (tool === "boundingbox") {
      if (
        event.target.getStage().container().style.cursor === "crosshair" &&
        selectedId === null &&
        newAnnotation.length === 0
      ) {
        const { x, y } = event.target.getStage().getPointerPosition();
        const id = uuid();
        setNewAnnotation([{ name: "", x, y, width: 0, height: 0, id }]);
      }
    } else if (tool === "polygon") {
      if (isPolyComplete) return;
      const stage = event.target.getStage();
      const mousePos = getMousePos(stage);
      if (isMouseOverPoint && points.length >= 3) {
        setPolyComplete(true);
      } else {
        setPoints([...points, mousePos]);
      }
    } else if (tool === "freedrawing") {
      isDrawing.current = true;
      const pos = event.target.getStage().getPointerPosition();
      setLines([...lines, { tool, points: [pos.x, pos.y] }]);
    }
  };

  const handleMouseMove = (event) => {
    if (tool === "boundingbox") {
      if (selectedId === null && newAnnotation.length === 1) {
        const sx = newAnnotation[0].x;
        const sy = newAnnotation[0].y;
        const { x, y } = event.target.getStage().getPointerPosition();
        const id = uuid();
        setNewAnnotation([
          {
            name: "",
            x: sx,
            y: sy,
            width: x - sx,
            height: y - sy,
            id,
          },
        ]);
      }
    } else if (tool === "polygon") {
      const stage = event.target.getStage();
      const mousePos = getMousePos(stage);
      setPosition(mousePos);
    } else if (tool === "freedrawing") {
      // no drawing - skipping
      if (!isDrawing.current) {
        return;
      }
      const stage = event.target.getStage();
      const point = stage.getPointerPosition();
      let lastLine = lines[lines.length - 1];
      // add point
      lastLine.points = lastLine.points.concat([point.x, point.y]);

      // replace last
      lines.splice(lines.length - 1, 1, lastLine);
      setLines(lines.concat());
    }
  };

  const handleMouseUp = () => {
    if (tool === "boundingbox") {
      if (selectedId === null && newAnnotation.length === 1) {
        if (newAnnotation[0].width > 10 && newAnnotation[0].height > 10) {
          allLabels.push(...newAnnotation);
          setAllLabels(allLabels);
        }
        setNewAnnotation([]);
      }
    } else if (tool === "freedrawing") {
      isDrawing.current = false;
    }
  };
  const handleMouseEnter = (event) => {
    if (currentTool === "text") {
      event.target.getStage().container().style.cursor = "default";
    } else {
      event.target.getStage().container().style.cursor = "crosshair";
    }
  };
  // const handleKeyDown = (event) => {
  //   if (event.keyCode === 8 || event.keyCode === 46) {
  //     if (selectedId !== null) {
  //       const temp = allLabels.filter(
  //         (annotation) => annotation.id !== selectedId
  //       );
  //       setAllLabels(temp);
  //     }
  //   }
  // };

  const handleMouseOverStartPointPoly = (e) => {
    if (isPolyComplete || points.length < 3) return;
    e.target.scale({ x: 3, y: 3 });
    setMouseOverPoint(true);
  };
  const handleMouseOutStartPointPoly = (e) => {
    e.target.scale({ x: 1, y: 1 });
    setMouseOverPoint(false);
  };
  const handlePointDragMovePoly = (e) => {
    const stage = e.target.getStage();
    const index = e.target.index - 1;
    const pos = [e.target._lastPos.x, e.target._lastPos.y];
    if (pos[0] < 0) pos[0] = 0;
    if (pos[1] < 0) pos[1] = 0;
    if (pos[0] > stage.width()) pos[0] = stage.width();
    if (pos[1] > stage.height()) pos[1] = stage.height();
    setPoints([...points.slice(0, index), pos, ...points.slice(index + 1)]);
  };
  const handleGroupDragEnd = (event) => {
    if (event.target.name() === "polygon") {
      let result = [];
      let copyPoints = [...points];
      copyPoints.map((point) =>
        result.push([point[0] + event.target.x(), point[1] + event.target.y()]),
      );
      event.target.position({ x: 0, y: 0 });
      setPoints(result);
    }
  };
  const reset = () => {
    setPoints([]);
    setPolyComplete(false);
  };

  useEffect(() => {
    setFlattenedPoints(
      points
        .concat(isPolyComplete ? [] : position)
        .reduce((a, b) => a.concat(b), []),
    );
  }, [points, isPolyComplete, position]);

  useEffect(() => {
    if (selectedId !== null) {
      dispatch(
        setSelectIndex(
          allLabels.findIndex((annotation) => annotation.id === selectedId),
        ),
      );
      if (deleteLabel) {
        const temp = allLabels.filter(
          (annotation) => annotation.id !== selectedId,
        );
        setAllLabels(temp);
        dispatch(setDeleteLabel(false));
      }
    } else {
      if (deleteLabel) {
        dispatch(setDeleteLabel(false));
      }
    }
  }, [selectedId, allLabels, dispatch, selectIndex, deleteLabel, setAllLabels]);

  return (
    // <Box sx={{}} >
    <PaperFrame
      tabIndex={1}
      // onKeyDown={handleKeyDown}
      col
      sx={{
        // alignItems: "center",
        justifyContent: "center",
        // maxWidth: "100%",
        overflow: "hidden",
        // border: "3px solid green",
        // mt: "13px",
        boxSizing: "border-box",
        backgroundColor: "transparent",
      }}
    >
      <Box
        sx={{
          display: "flex",
          // justifyContent: "center",
          alignItems: "center",
          boxSizing: "border-box",
          // border: "3px solid red",
        }}
      >
        {displayedImages.map((slide, index) => {
          return (
            <div key={index}>
              {slide.imageId === currentImage && (
                <Stage
                  width={900}
                  height={600}
                  onMouseEnter={handleMouseEnter}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <Layer>
                    <LoadImage
                      imageUrl={slide.url}
                      imageId={slide.imageId}
                      onMouseDown={() => {
                        setSelectId(null);
                      }}
                      setOffsetY={setOffsetY}
                      allLabels={allLabels}
                      setAllLabels={setAllLabels}
                      mask={false}
                    />

                    {tool === "bounding" &&
                      [...allLabels, ...newAnnotation].map((annotation, i) => {
                        return (
                          <Group draggable key={i}>
                            <Label x={annotation.x} y={annotation.y}>
                              <Tag
                                fill="white"
                                lineJoin="round"
                                shadowColor="black"
                              />
                              <Text
                                text={
                                  selectIndex === i
                                    ? currentLabels
                                    : annotation.name
                                }
                                fontFamily="Helvetica"
                                fontSize={15}
                                fill="black"
                              />
                            </Label>
                            <BoundingBox
                              shapeProps={annotation}
                              onSelect={() => {
                                setSelectId(annotation.id);
                                dispatch(setCurrentLabels(annotation.name));
                              }}
                              isSelected={annotation.id === selectedId}
                              onChange={(newAttrs) => {
                                const rects = allLabels.slice();
                                rects[i] = newAttrs;
                                setAllLabels(rects);
                              }}
                            />
                          </Group>
                        );
                      })}

                    {visibility &&
                      currDatasetName !== "Medical" &&
                      allLabels.map((annotation, i) => {
                        return (
                          <Group draggable key={i}>
                            <Label x={annotation.x} y={annotation.y}>
                              <Tag
                                fill="white"
                                lineJoin="round"
                                shadowColor="black"
                              />
                              <Text
                                text={
                                  selectIndex === i
                                    ? currentLabels
                                    : annotation.name
                                }
                                fontFamily="Helvetica"
                                fontSize={15}
                                fill="black"
                              />
                            </Label>
                            <BoundingBox
                              shapeProps={annotation}
                              onSelect={() => {
                                // setSelectId(annotation.id);
                                // dispatch(setCurrentLabels(annotation.name));
                              }}
                              isSelected={annotation.id === selectedId}
                              // onChange={(newAttrs) => {
                              //   const rects = allLabels.slice();
                              //   rects[i] = newAttrs;
                              //   setAllLabels(rects);
                              // }}
                            />
                          </Group>
                        );
                      })}

                    {tool === "polygon" && (
                      <Polygon
                        points={points}
                        flattenedPoints={flattenedPoints}
                        handlePointDragMove={handlePointDragMovePoly}
                        handleGroupDragEnd={handleGroupDragEnd}
                        handleMouseOverStartPoint={
                          handleMouseOverStartPointPoly
                        }
                        handleMouseOutStartPoint={handleMouseOutStartPointPoly}
                        isFinished={isPolyComplete}
                      />
                    )}

                    {tool === "freedrawing" &&
                      lines.map((line, i) => (
                        <Line
                          key={i}
                          points={line.points}
                          stroke="white"
                          strokeWidth={5}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                          globalCompositeOperation={
                            line.tool === "eraser"
                              ? "destination-out"
                              : "source-over"
                          }
                        />
                      ))}

                    {tool === "text" && (
                      <Label x={390} y={offsetY} padding={1}>
                        <Tag
                          fill="white"
                          lineJoin="round"
                          shadowColor="black"
                          padding="2px"
                          margin="1px"
                        />
                        <Text
                          width={!currentLabels ? 0 : 120}
                          height={!currentLabels ? 0 : 22}
                          ellipsis={true}
                          align="center"
                          text={currentLabels}
                          fontFamily="Helvetica"
                          fontSize={20}
                          fill="black"
                        />
                      </Label>
                    )}
                    {visibility && currDatasetName == "Medical" && (
                      <LoadImage
                        imageUrl={slide.url}
                        imageId={slide.imageId}
                        onMouseDown={() => {
                          setSelectId(null);
                        }}
                        setOffsetY={setOffsetY}
                        allLabels={allLabels}
                        setAllLabels={setAllLabels}
                        mask={true}
                      />
                    )}
                  </Layer>
                </Stage>
              )}
            </div>
          );
        })}
      </Box>

      <Box
        sx={{
          // height: "10%",
          // justifyContent: "center",
          flexGrow: 0,
          alignItems: "center",
          display: "flex",
          flexDirection: "row",
          boxSizing: "border-box",
          width: "100%",
          maxWidth: "100%",
          mt: "10px",
          // border: "3px solid yellow",
          overflow: "hidden",
        }}
      >
        {/* <Box id="canvas-labeltype-container" sx={{
          display: "flex",
          flexBasis: "10%",
          justifyContent: "flex-end",
          alignItems: "center",
          boxSizing: "border-box",
          width: "100%",
        }}>

        </Box> */}

        <Box
          id="canvas-labelPanel-container"
          sx={{
            display: "flex",
            // flexBasis: "90%",
            justifyContent: "flex-start",
            alignItems: "center",
            boxSizing: "border-box",
            width: "100%",
          }}
        >
          <LabelPanel />
        </Box>
      </Box>
    </PaperFrame>
    // </Box>
  );
};

import React, { useState } from "react";
import { Line, Circle, Group, Label, Tag, Text } from "react-konva";
import { minMax, dragBoundFunc } from "./utils";
/**
 *
 * @param {minMaxX} props
 * minMaxX[0]=>minX
 * minMaxX[1]=>maxX
 *
 */
const Polygon = (props) => {
  const {
    points,
    flattenedPoints,
    isFinished,
    handlePointDragMove,
    handleGroupDragEnd,
    handleMouseOverStartPoint,
    handleMouseOutStartPoint,
  } = props;
  const vertexRadius = 6;

  const [stage, setStage] = useState();

  const handleGroupMouseOver = (e) => {
    if (!isFinished) return;
    e.target.getStage().container().style.cursor = "move";
    setStage(e.target.getStage());
  };
  const handleGroupMouseOut = (e) => {
    e.target.getStage().container().style.cursor = "default";
  };

  const [minMaxX, setMinMaxX] = useState([0, 0]); //min and max in x axis
  const [minMaxY, setMinMaxY] = useState([0, 0]); //min and max in y axis
  const handleGroupDragStart = (e) => {
    let arrX = points.map((p) => p[0]);
    let arrY = points.map((p) => p[1]);
    setMinMaxX(minMax(arrX));
    setMinMaxY(minMax(arrY));
  };
  const groupDragBound = (pos) => {
    let { x, y } = pos;
    const sw = stage.width();
    const sh = stage.height();
    if (minMaxY[0] + y < 0) y = -1 * minMaxY[0];
    if (minMaxX[0] + x < 0) x = -1 * minMaxX[0];
    if (minMaxY[1] + y > sh) y = sh - minMaxY[1];
    if (minMaxX[1] + x > sw) x = sw - minMaxX[1];
    return { x, y };
  };
  return (
    <Group
      name="polygon"
      draggable={isFinished}
      onDragStart={handleGroupDragStart}
      onDragEnd={handleGroupDragEnd}
      dragBoundFunc={groupDragBound}
      onMouseOver={handleGroupMouseOver}
      onMouseOut={handleGroupMouseOut}
    >
      {points.map((point, index) => {
        const x = index === 0 ? point[0] - vertexRadius / 2 : null;
        const y = index === 0 ? point[1] - vertexRadius / 2 : null;
        return x && y ? (
          <Label x={x} y={y}>
            <Tag fill="white" lineJoin="round" shadowColor="black" />
            <Text text="Name" fontFamily="Calibri" fontSize={15} fill="black" />
          </Label>
        ) : null;
      })}
      <Line
        points={flattenedPoints}
        strokeWidth={3}
        closed={isFinished}
        fill="transparent"
        stroke="white"
      />
      {points.map((point, index) => {
        const x = point[0] - vertexRadius / 2;
        const y = point[1] - vertexRadius / 2;
        const startPointAttr =
          index === 0
            ? {
                hitStrokeWidth: 12,
                onMouseOver: handleMouseOverStartPoint,
                onMouseOut: handleMouseOutStartPoint,
              }
            : null;
        return (
          <Circle
            key={index}
            x={x}
            y={y}
            radius={vertexRadius}
            fill="white"
            stroke="#00F1FF"
            strokeWidth={2}
            draggable
            onDragMove={handlePointDragMove}
            dragBoundFunc={(pos) =>
              dragBoundFunc(stage.width(), stage.height(), vertexRadius, pos)
            }
            {...startPointAttr}
          />
        );
      })}
    </Group>
  );
};

export default Polygon;

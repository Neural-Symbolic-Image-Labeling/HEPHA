import { useDispatch, useSelector } from "react-redux";
import React, { useState } from "react";
import { Box } from "@mui/material";
import { PaperFrame } from "../../../../../../components";
import {
  setCurrentTool,
  setDeleteLabel,
  setViewPred,
} from "../../../../../../stores/workstation";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import BrushIcon from "@mui/icons-material/Brush";
import PolylineIcon from "@mui/icons-material/Polyline";
import TitleIcon from "@mui/icons-material/Title";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export const Toolbar = () => {
  const dispatch = useDispatch();
  const tool = useSelector((state) => state.workstation.currentTool);
  const visibility = useSelector((state) => state.workstation.viewPred);

  return (
    <PaperFrame
      col
      sx={{
        width: "100%",
        height: "wrap-content",
        justifyContent: "center",
        alignItems: "center",
        p: "15px 5px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          border: 1,
          mb: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          backgroundColor: tool === "boundingbox" ? "#f0f2f5" : "transparent",
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
          <VisibilityOffIcon fontSize="large" />
        ) : (
          <VisibilityIcon fontSize="large" />
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          mb: 1,
          border: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          "&:hover": {
            backgroundColor: "bg.main",
            opacity: [0.9, 0.9, 0.7],
          },
        }}
        onClick={() => {
          dispatch(setDeleteLabel(true));
        }}
      >
        <DeleteForeverIcon fontSize="large" />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          border: 1,
          mb: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          backgroundColor: tool === "boundingbox" ? "#f0f2f5" : "transparent",
          "&:hover": {
            backgroundColor: "bg.main",
            opacity: [0.9, 0.9, 0.7],
          },
        }}
        onClick={() => {
          dispatch(setCurrentTool("boundingbox"));
        }}
      >
        <HighlightAltIcon fontSize="large" />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          mb: 1,
          border: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          backgroundColor: tool === "polygon" ? "#f0f2f5" : "transparent",
          "&:hover": {
            backgroundColor: "bg.main",
            opacity: [0.9, 0.9, 0.7],
          },
        }}
        onClick={() => {
          dispatch(setCurrentTool("polygon"));
        }}
      >
        <PolylineIcon fontSize="large" />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          mb: 1,
          border: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          backgroundColor: tool === "freedrawing" ? "#f0f2f5" : "transparent",
          "&:hover": {
            backgroundColor: "bg.main",
            opacity: [0.9, 0.9, 0.7],
          },
        }}
        onClick={() => {
          dispatch(setCurrentTool("freedrawing"));
        }}
      >
        <BrushIcon fontSize="large" />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: 40,
          height: 40,
          mb: 1,
          border: 1,
          borderRadius: 1,
          borderColor: "bg.main",
          backgroundColor: tool === "text" ? "#f0f2f5" : "transparent",
          "&:hover": {
            backgroundColor: "bg.main",
            opacity: [0.9, 0.9, 0.7],
          },
        }}
        onClick={() => {
          dispatch(setCurrentTool("text"));
        }}
      >
        <TitleIcon fontSize="large" />
      </Box>
    </PaperFrame>
  );
};

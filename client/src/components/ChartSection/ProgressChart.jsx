import { Box, Typography } from "@mui/material";
import * as React from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { hexToRgba } from "../../utils/chart";

const getDisplayClassName = (className) => {
  if (className.length <= 8) return className;
  return className.slice(0, 8) + "...";
}

export const ProgressChart = ({ acc, color, className, size = "82px" }) => {
  if (isNaN(acc) || !color) return <></>;

  const accuracy = React.useMemo(() => {
    return (acc * 100).toFixed(0);
  }, [acc]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: size,
        width: size,
        flexDirection: "column",
        p: "1px",
      }}
    >
      <div style={{ position: "relative", width: "70%", height: "70%" }}>
        <CircularProgressbar
          value={accuracy}
          strokeWidth={14}
          styles={buildStyles({
            textSize: "16px",
            // How long animation takes to go from one percentage to another, in seconds
            pathTransitionDuration: 0.5,
            pathColor: hexToRgba(color, 100),
            textColor: color,
            trailColor: "#d6d6d6",
            backgroundColor: "#ffffff",
          })}
        />
        <div
          style={{
            color: color,
            fontWeight: 600,
            fontSize: "13px",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 999,
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {accuracy}%
        </div>
      </div>

      <Typography sx={{ color: color, fontSize: "12px", fontWeight: 600 }}>
        {getDisplayClassName(className)}
      </Typography>
    </Box >
  );
};

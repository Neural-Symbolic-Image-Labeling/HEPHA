import { Paper } from "@mui/material";

const borderStyle = "1.5px solid rgba(193, 193, 193, 1)";

/**
 * @param {{ sx: import('@mui/system').SxProps}} props
 */
export const PaperFrame = ({ children, col = false, sx }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: "5px",
        display: "flex",
        flexDirection: col ? "column" : "row",
        boxSizing: "border-box",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

import { Box, Typography } from "@mui/material";
import { colorPicker } from "../muiStyles";

/**
 * @param {{label: string; type: "unlabeled" | "auto" | "manual"}} param0
 */
export const LabelItem = ({ label, type }) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "60px",
          height: "30px",
          // color: colorPicker[type],
          // borderRadius: "8px",
        }}
      >
        <Typography
          sx={{
            // color: "white",
            color: colorPicker[type],
          }}
          variant="body1"
        >
          {/* <strong> */}
          {label}
          {/* </strong> */}
        </Typography>
      </Box>
    </Box>
  );
};

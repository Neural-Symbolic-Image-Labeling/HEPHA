import { Box } from "@mui/material";

export const Intermediate = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      {children}
    </Box>
  );
};

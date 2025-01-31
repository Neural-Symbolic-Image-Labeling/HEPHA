import { Box } from "@mui/material";
import { ClassColorProvider } from "../../../context/ClassColorContext";
import { Workstation } from "./Workstation";

/**Body Wrapper
 * The Body section contains the main content of the page.
 * It seperates the remaining page content into two parts: Workstation and ResultSideBar.
 */
export const Body = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        height: "950px",
        // minHeight: "116.5vh",
        // maxHeight: "116.5vh",
        padding: "10px",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100vw",
          height: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <ClassColorProvider>
          <Workstation />
        </ClassColorProvider>
      </Box>
    </Box>
  );
};

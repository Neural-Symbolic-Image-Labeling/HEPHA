import { Box } from "@mui/material";
import { ChartSection } from "../../../../components/ChartSection";
import { RuleSection } from "../../../../components/RuleSection";
import { ClassColorProvider } from "../../../../context/ClassColorContext";

/**ResultSideBar Wrapper
 * The ResultSideBar section acts as a wrapper for ChartSection and RuleSection.
 */
export const ResultSideBar = () => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <ClassColorProvider>
        <ChartSection />
        <RuleSection />
      </ClassColorProvider>
    </Box>
  );
};

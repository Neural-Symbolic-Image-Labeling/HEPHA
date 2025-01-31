import { Box, Typography } from "@mui/material";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  registerables,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useClassColor } from "../../context/ClassColorContext";
import { findCollection } from "../../utils/workspace";
import { Intermediate } from "../Intermediate";
import { PaperFrame } from "../PaperFrame";
import { ProgressChart } from "./ProgressChart";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);
ChartJS.register(...registerables);

export const ChartSection = ({ showClassAcc = true }) => {
  const workspace = useSelector((state) => state.workspace.workspace);
  const isLoading = useSelector((state) => state.workspace.loading);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const statistics = workspace
    ? currCollection
      ? currCollection.statistics
      : null
    : null;

  const accuracy = useMemo(() => {
    if (!currCollection?.statistics?.accuracy) return null;
    return currCollection ? currCollection.statistics.accuracy : null;
  }, [currCollection?.statistics?.accuracy]);

  const { colors: classColors } = useClassColor();

  const class_accuracies = useMemo(() => {
    if (!showClassAcc) return [];
    if (!classColors) return [];
    if (!statistics?.label_coverage) return [];
    return Object.keys(statistics.label_coverage).map((key, index) => ({
      accuracy: statistics.label_coverage[key],
      color: classColors[key],
      className: key,
    }));
  }, [statistics?.label_coverage, classColors]);

  return (
    <PaperFrame
      col
      sx={{
        alignItems: "center",
        width: "100%",
        // minHeight: "35vh",
        // overflow: "hidden",
        maxHeight: "80vh",
        minHeight: "15vh",
        // pb: "6px",
      }}
    >
      {/* {JSON.stringify(labelsInfo)} */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          justifyContent: "flex-start",
          minHeight: "0",
          pt: "10px",
          pl: "25px",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          color="purple.dark"
          sx={{
            fontWeight: "bold",
            fontSize: "18px",
            lineHeight: "19px",
          }}
        >
          Accuracy
        </Typography>
      </Box>
      {isLoading ? (
        <Intermediate>Loading...</Intermediate>
      ) : !workspace ? (
        <Intermediate>No Data</Intermediate>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minWidth: "0",
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            alignItems: "start",
            justifyContent: "center",
            mt: "15px",
            mb: "10px",
            // overflow: "scroll",
          }}
        >

          <Box
            sx={{
              display: "flex",
              width: "100%",
              flexDirection: "row",
              justifyContent: "left",
              alignItems: "center",
              mt: "5px",
            }}
          >
            <Box>
              <ProgressChart acc={accuracy} color={"#000000"} className="Overall" size="102px" />
            </Box>
            <Box sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              alignItems: "center",
              width: "100%",
              height: "100%",
              flexWrap: "wrap",
            }}>
              {class_accuracies.map((class_acc, index) => (
                <ProgressChart
                  key={index}
                  className={class_acc.className}
                  acc={class_acc.accuracy}
                  color={class_acc.color}
                />
              ))}
            </Box>
          </Box>

        </Box>
      )}
    </PaperFrame>
  );
};

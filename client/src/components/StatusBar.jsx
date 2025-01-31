import { Box, Divider, Typography } from "@mui/material";
import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { colorPicker } from "../muiStyles";
import { setFilters } from "../stores/workspace";
import { getManualInfo } from "../utils/chart";
import { getImageType } from "../utils/images";
import { findCollection } from "../utils/workspace";
import { PaperFrame } from "./index";

export const generateStatus = (collection) => {
  const result = {
    total: 0,
    manual: 0,
    auto: 0,
    unlabeled: 0,
    conflict: 0,
  };
  for (let img of collection.images) {
    result[getImageType(img)]++;
    result.total++;
  }
  return result;
};

const get_label_title = (label) => {
  // cut label if too long by taking letters before "_"
  if (label.length >= 10) {
    return label.split("_")[0];
  }
  return label;
}

export const StatusBar = () => {
  const workspace = useSelector((state) => state.workspace.workspace);
  const isLoading = useSelector((state) => state.workspace.loading);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const stats = workspace
    ? currCollection
      ? generateStatus(currCollection)
      : null
    : null;

  const labelInfo = useMemo(() => {
    if (!currCollection?.images) return [];
    return getManualInfo(currCollection?.images);
  }, [currCollection?.images]);

  const BarData = useMemo(() => {
    if (!workspace || !labelInfo?.labels) return null;
    return {
      labels: [""],
      datasets: labelInfo.labels
        .filter((_, index) => labelInfo.values[index] >= 10)
        .map((label, index) => ({
          label: label,
          data: [labelInfo.values[index]],
          backgroundColor: labelInfo.colors[index],
          hoverBackgroundColor: labelInfo.colors[index],
        }))
    };
  }, [labelInfo]);

  return (
    <PaperFrame
      sx={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        pt: "8px",
        pb: "8px",
        height: "100%",
        // overflow: "scroll",
      }}
    >
      {/* Wrapper */}
      <Box sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        p: "0 10px",
      }}>
        {/* Status Items */}
        <Box sx={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          height: "100%",
          boxSizing: "border-box",
          // mr: "10px",
          width: "100%",
          flexBasis: "60%",
        }}>
          {/* <StatusItem
            color={colorPicker.conflict}
            label="Conflicts"
            value={stats ? ((stats.conflict / stats.total) * 100).toFixed(0) : null}
            loading={isLoading}
            type="conflict"
          /> */}
          <StatusItem
            color={colorPicker.auto}
            label="Auto-Labeled"
            value={stats ? ((stats.auto / stats.total) * 100).toFixed(0) : null}
            loading={isLoading}
            type="auto"
          />
          <StatusItem
            color={colorPicker.unlabeled}
            label="Unlabeled"
            value={
              stats ? ((stats.unlabeled / stats.total) * 100).toFixed(0) : null
            }
            loading={isLoading}
            type="unlabeled"
          />
        </Box>

        {/* Class Bar Chart */}
        {BarData && (
          <Box sx={{
            display: 'flex',
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            alignItems: "center",
          }}>
            <Divider orientation="vertical" variant="fullWidth" flexItem />
            <StatusItem
              color={colorPicker.manual}
              label="Manual"
              value={stats ? ((stats.manual / stats.total) * 100).toFixed(0) : null}
              loading={isLoading}
              type="manual"
              sx={{ ml: "10px" }}
            />
            {/* <Box sx={{
              display: "flex",
              width: "70%",
              flexDirection: "column",
              height: "100%",
              justifyContent: "start",
              alignItems: "center",
              boxSizing: "border-box",
              flexBasis: "55%",
              p: "5px 5px",
              // ml: "5px",
            }}>
              <Box sx={{
                flexBasis: "70%",
                width: "100%",
              }}>
                <ClassBarChart data={BarData} options={BarOptions} height="26%" width="100%" />
              </Box>
            </Box> */}
            <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
              {`(`}
            </Typography>
            {labelInfo.labels.map((label, index) => (
              <Box key={index} sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                height: "30px",
                boxSizing: "border-box",
                p: "0 5px",
              }}>
                <Typography sx={{ fontSize: "12px", color: labelInfo.colors[index], fontWeight: "bold" }}>
                  {`${get_label_title(label)}: ${Number(labelInfo.values[index]).toFixed(0)}%`}
                </Typography>
              </Box>
            ))
            }
            <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
              {`)`}
            </Typography>
          </Box>
        )}
      </Box>

    </PaperFrame>
  );
};

const StatusItem = ({
  color,
  label,
  value,
  loading,
  type,
  isButton = true,
  sx,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.workspace.filters);

  const handleClick = () => {
    if (!isButton) return;
    if (filters.type === type) {
      dispatch(setFilters({ ...filters, type: "" }));
    } else {
      dispatch(setFilters({ ...filters, type: type }));
    }
  };

  return (
    <Box
      sx={{
        ...sx,
        display: "flex",
        alignItems: "center",
        p: "5px",
        border:
          filters.type === type
            ? `2px solid ${color}`
            : "2px solid transparent",
        borderRadius: "5px",
        "&:hover": {
          cursor: isButton ? "pointer" : "default",
        },
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          bgcolor: color,
          height: "18px",
          width: "18px",
          mr: "6px",
        }}
      />
      <Typography sx={{ fontSize: "14px" }}>{`${label}:`}</Typography>
      <Typography sx={{ ml: "5px", fontSize: "14px", fontWeight: "bold" }}>
        {loading ? "Loading" : value === null ? "N/A" : `${value}%`}
      </Typography>
    </Box>
  );
};

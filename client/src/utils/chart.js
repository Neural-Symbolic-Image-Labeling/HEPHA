import { colorPicker } from "../muiStyles";
import { getImageType } from "./images";

export const chartColors = [
  "#336699",
  "#99CCFF",
  "#999933",
  "#666699",
  "#CC9933",
  "#006666",
  "#3399FF",
  "#993300",
  "#CCCC99",
  "#666666",
  "#FFCC66",
  "#6699CC",
  "#663366",
  "#9999CC",
  "#CCCCCC",
  "#669999",
  "#CCCC66",
  "#CC6600",
  "#9999FF",
  "#0066CC",
  "#99CCCC",
  "#999999",
  "#FFCC00",
  "#009999",
  "#99CC33",
  "#FF9900",
  "#999966",
  "#66CCCC",
  "#339966",
  "#CCCC33",
  "#003f5c",
  "#665191",
  "#a05195",
  "#d45087",
  "#2f4b7c",
  "#f95d6a",
  "#ff7c43",
  "#ffa600",
  "#EF6F6C",
  "#465775",
  "#56E39F",
  "#59C9A5",
  "#5B6C5D",
  "#0A2342",
  "#2CA58D",
  "#84BC9C",
  "#CBA328",
  "#F46197",
  "#DBCFB0",
  "#545775",
];

export const getManualInfo = (images) => {
  const labels = [];
  const values = [];
  const colors = [];
  let count = 0;

  if (!images) {
    return {
      labels: ["unlabeled"],
      values: [100],
      colors: [colorPicker.unlabeled],
    };
  }

  let nextColorIndex = 0;
  const labelMap = new Map();
  images.forEach((item) => {
    let type = getImageType(item);
    if (type === "manual") {
      count++;
      item.labels.forEach((label) => {
        label.name.forEach((n) => {
          if (!labelMap.has(n)) {
            labelMap.set(n, 0);
            colors.push(chartColors[nextColorIndex]);
            nextColorIndex++;
          }
          labelMap.set(n, labelMap.get(n) + 1);
        });
      });
    }
  });
  for (let key of labelMap.keys()) {
    labels.push(key);
    values.push(((labelMap.get(key) / count) * 100).toFixed(2));
  }
  if (labels.length === 0) {
    return {
      labels: ["unlabeled"],
      values: [100],
      colors: [colorPicker.unlabeled],
    };
  }
  return { labels, values, colors };
};

export const getRuleLabelInfo = (images) => {
  if (!images)
    return {
      labels: ["unlabeled"],
      values: [100],
      colors: [colorPicker.unlabeled],
    };
  let nextColorIndex = 0;
  const colors = [];
  const labels = new Map();
  let nonSpecials = 0;
  let key;
  images.forEach((item) => {
    let type = getImageType(item);
    // alert(type);
    let key;
    // handle special types
    if (type === "unlabeled") {
      key = type;
      if (!labels.has(key)) {
        labels.set(key, 0);
        colors.push(colorPicker[type]);
      }
      labels.set(key, labels.get(key) + 1);
    }
    if (type === "conflict") {
      key = type;
      item.labels.forEach((label) => {
        label.name.forEach((n) => {
          if (!labels.has(key)) {
            labels.set(key, 0);
            colors.push(colorPicker[type]);
          }
          labels.set(key, labels.get(key) + 1);
        });
      });
      return;
    }
    // handle normal types
    item.labels.forEach((label) => {
      label.name.forEach((n) => {
        key = n;
        if (!labels.has(key)) {
          labels.set(key, 0);
          colors.push(chartColors[nextColorIndex]);
          nextColorIndex++;
        }
        labels.set(key, labels.get(key) + 1);
        nonSpecials++;
      });
    });
  });
  let unlabeledCount = labels.has("unlabeled") ? labels.get("unlabeled") : 0;
  let conflictCount = labels.has("conflict") ? labels.get("conflict") : 0;
  let remainingPortion =
    (images.length - unlabeledCount - conflictCount) / images.length;
  // normalize
  for (let key of labels.keys()) {
    if (key === "unlabeled" || key === "conflict") {
      labels.set(key, ((labels.get(key) / images.length) * 100).toFixed(2));
      continue;
    }
    let portion = remainingPortion * (labels.get(key) / nonSpecials) * 100;
    labels.set(key, portion.toFixed(2));
  }
  // console.log(labels);
  if (labels.size === 0)
    return {
      labels: ["unlabeled"],
      values: [100],
      colors: [colorPicker.unlabeled],
    };
  return {
    labels: Array.from(labels.keys()),
    values: Array.from(labels.values()),
    colors: colors,
  };
};

export const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const rgbaAlpha = (rgba, alpha) => {
  const [r, g, b, a] = rgba
    .slice(5, -1)
    .split(",")
    .map((x) => parseFloat(x));
  return `rgba(${r}, ${g}, ${b}, ${a * alpha})`;
};

export const addColorDepth = (color, depth) => {
  const r = parseInt(color.slice(1, 3), 16) + depth;
  const g = parseInt(color.slice(3, 5), 16) + depth;
  const b = parseInt(color.slice(5, 7), 16) + depth;
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
};

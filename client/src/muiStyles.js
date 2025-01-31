import { createTheme } from "@mui/material";

export const colorPicker = {
  auto: "rgba(217, 95, 14, 0.9)",
  unlabeled: "rgba(102, 102, 102, 0.9)",
  manual: "rgba(44, 162, 95, 0.9)",
  conflict: "rgba(209, 0, 0, 1)",
  accuracy: "rgba(0, 0, 0, 0.9)",
};

export const adjustedScrollbar = {
  hidden: {
    // Chrome
    "&::-webkit-scrollbar": {
      display: "none",
    },
    // Firefox
    scrollbarWidth: "none",
  },
  thin: {
    // Chrome
    "::-webkit-scrollbar": {
      width: "9px",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(155, 155, 155, 0.5)",
      borderRadius: "20px",
      border: "transparent",
    },
    // Firefox
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
  },
  superthin: {
    // Chrome
    "::-webkit-scrollbar": {
      width: "4.5px",
    },
    "::-webkit-scrollbar-track": {
      background: "transparent",
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: "rgba(155, 155, 155, 0.5)",
      borderRadius: "20px",
      border: "transparent",
    },
    // Firefox
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(155, 155, 155, 0.5) transparent",
  },
};

export const theme = createTheme({
  palette: {
    primary: {
      main: "rgba(4, 18, 141, 1)",
    },
    purple: {
      dark: "rgba(4, 18, 141, 0.8)",
      light: "rgba(90, 106, 191, 1)",
    },
    bg: {
      main: "rgba(1, 36, 88, 0.08)",
      canvas: "rgba(219, 227, 240, 0.72)",
      hovergrey: "rgba(255, 255, 255, 0.2)",
    },
    auto: {
      main: colorPicker.auto,
    },
    unlabeled: {
      main: colorPicker.unlabeled,
    },
    manual: {
      main: colorPicker.manual,
    },
    conflict: {
      main: colorPicker.conflict,
    },
  },
  typography: {
    fontFamily: ["Helvetica"],
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "@font-face": {
          "font-family": "Helvetica",
          "font-style": "normal",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          fontSize: "12px",
          fontWeight: "700",
        },
      },
    },
  },
});

export const ClassColorPalette = [
  "#7C6E61",
  "#6677ff",
  "#A0A29A",
  "#ACA59A",
  "#C0B0A0",
];

export const BarOptions = {
  indexAxis: "y",
  plugins: {
    legend: {
      display: false,
      position: "bottom",
    },
    tooltip: {
      position: "nearest",
      // enabled: false,
    },
    datalabels: {
      formatter: (value, context) => `${Number(value).toFixed(0)}%`,
      color: "white",
      font: {
        size: 12,
        weight: "bold",
      },
    },
  },
  scales: {
    x: {
      stacked: true,
      display: false,
      beginAtZero: true,
      max: 100,
    },
    y: {
      stacked: true,
      display: false,
      beginAtZero: true,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
};

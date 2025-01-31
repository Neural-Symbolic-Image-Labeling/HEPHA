import { ThemeProvider } from "@mui/material/styles";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { GlobalAlertProvider } from "./components/GlobalAlertProvider";
import { BlocklyWorkspaceProvider } from "./context/BlocklyWorkspaceContext";
import "./index.css";
import { theme } from "./muiStyles";
import reportWebVitals from "./reportWebVitals";
import { WebRouters } from "./routers";
import store from "./stores";

// Sentry.init({
//   dsn: import.meta.env.VITE_SENTRY_DSN,
//   integrations: [
//     Sentry.captureConsoleIntegration(),
//     Sentry.browserTracingIntegration(),
//     Sentry.replayIntegration(),
//   ],
//   // debug: true,
//   environment: import.meta.env.PROD ? "production" : "development",
//   // Performance Monitoring
//   tracesSampleRate: 0.5,
//   // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
//   tracePropagationTargets: [
//     "localhost",
//     "http://ec2-54-165-238-20.compute-1.amazonaws.com",
//   ],
//   // Session Replay
//   replaysSessionSampleRate: 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
//   replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
// });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <GlobalAlertProvider>
          <BlocklyWorkspaceProvider>
            <WebRouters />
          </BlocklyWorkspaceProvider>
        </GlobalAlertProvider>
      </ThemeProvider>
    </Provider>
  </>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

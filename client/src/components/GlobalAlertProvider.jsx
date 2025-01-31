import { Alert, Snackbar } from "@mui/material";
import { createContext, useState } from "react";

export const GlobalAlertContext = createContext();

export const GlobalAlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const handleClose = () => {
    setAlert({
      ...alert,
      open: false,
    });
  };

  return (
    <GlobalAlertContext.Provider value={{ alert, setAlert }}>
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
      {children}
    </GlobalAlertContext.Provider>
  );
};

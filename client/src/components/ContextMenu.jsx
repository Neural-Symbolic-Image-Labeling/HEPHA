import { Box, ClickAwayListener } from "@mui/material";
import { Fragment } from "react";

export const ContextMenu = ({ x, y, showMenu, setShowMenu, children }) => {
  return (
    <Fragment>
      {showMenu && (
        <Box
          sx={{
            position: "absolute",
            top: y,
            left: x,
            zIndex: "100",
          }}
        >
          <ClickAwayListener onClickAway={() => setShowMenu(false)}>
            {children}
          </ClickAwayListener>
        </Box>
      )}
    </Fragment>
  );
};

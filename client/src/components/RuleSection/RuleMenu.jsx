import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import { Delete, Lock } from "@mui/icons-material";
import { Fragment } from "react";
import { ContextMenu } from "../../../../../components";

const defaultMenuItems = [
  {
    name: "Delete",
    icon: <Delete />,
    handleClick: () => {
      alert("Delete");
    },
  },
  {
    name: "Lock",
    icon: <Lock />,
    handleClick: () => {
      alert("Lock");
    },
  },
];

export const RuleMenu = ({
  x,
  y,
  showMenu,
  setShowMenu,
  menuItems = defaultMenuItems,
}) => {
  return (
    <Fragment>
      <ContextMenu showMenu={showMenu} setShowMenu={setShowMenu} x={x} y={y}>
        <Paper
          sx={{
            width: "auto",
            height: "auto",
            backgroundColor: "white",
          }}
        >
          <nav>
            <List sx={{}}>
              {menuItems.map((item, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemButton onClick={() => item.handleClick()}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.name} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </nav>
        </Paper>
      </ContextMenu>
    </Fragment>
  );
};

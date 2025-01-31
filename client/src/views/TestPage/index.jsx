import React from "react";
import { Box, Button } from "@mui/material";

import { BlockyField } from "../../components/RuleSection/BlocklyField";

export const TestPage = () => {
  const [rules, setRules] = React.useState([
    { name: "Rule 1", clauses: [] },
    { name: "Rule 2", clauses: [] },
  ]);
  const [newRules, setNewRules] = React.useState([]);
  const [requireUpdate, setReqireUpdate] = React.useState(false);
  const [objects, _] = React.useState([
    "Car",
    "Person",
    "Bike",
    "Fence",
    "Guitar",
  ]);

  return (
    <Box
      sx={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        border: "3px solid black",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "20%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            width: "100%",
            wordBreak: "break-all",
          }}
        >
          {JSON.stringify(rules)}
          <br />
          {JSON.stringify(newRules)}
        </Box>
        <Button
          onClick={() => {
            setReqireUpdate(true);
          }}
        >
          Update
        </Button>
      </Box>
      <BlockyField
        rules={rules}
        objects={objects}
        setNewRules={setNewRules}
        updateState={[requireUpdate, setReqireUpdate]}
      />
    </Box>
  );
};

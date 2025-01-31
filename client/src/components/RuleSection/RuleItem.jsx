import { Box, IconButton, Typography } from "@mui/material";
import { LocalOffer, ControlPoint } from "@mui/icons-material";
import { Fragment } from "react";
import { ClauseItem } from "./ClauseItem";

export const RuleItem = ({ rule, indexR, setRules, rules }) => {
  const handleAddClause = () => {
    let temp = JSON.parse(JSON.stringify(rules));
    temp[indexR].clauses.push({
      literals: [
        {
          literal: "",
          naturalValue: "New Clause",
          deleted: false,
          locked: false,
          new: true,
        },
      ],
      deleted: false,
      locked: false,
    });
    setRules(temp);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        boxSizing: "border-box",
        border: "2px solid #E5EBF4",
        borderRadius: "5px",
        mb: "10px",
        p: "16px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: "10px",
        }}
      >
        <LocalOffer />
        <Typography
          sx={{
            fontSize: "17px",
            lineHeight: "26px",
            letterSpacing: "0.15px",
            ml: "12px",
          }}
        >
          {rule.name}
        </Typography>
      </Box>

      {rule.clauses.map((clause, index) => (
        <Box key={index}>
          {clause.deleted ? null : (
            <Fragment>
              {rule.clauses.findIndex((c) => !c.deleted) !== index && (
                <Typography
                  sx={{
                    fontWeight: "700",
                    fontSize: "22px",
                    lineHeight: "36px",
                    mt: "6px",
                    mb: "6px",
                  }}
                >
                  OR
                </Typography>
              )}
              <ClauseItem
                clause={clause}
                indexR={indexR}
                indexC={index}
                setRules={setRules}
                rules={rules}
              />
            </Fragment>
          )}
        </Box>
      ))}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          mt: "5px",
        }}
      >
        <IconButton onClick={() => handleAddClause()}>
          {/* <ControlPoint /> */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="12" fill="#D9D9D9" />
            <path
              d="M12.75 7C12.75 6.58579 12.4142 6.25 12 6.25C11.5858 6.25 11.25 6.58579 11.25 7H12.75ZM11.25 17C11.25 17.4142 11.5858 17.75 12 17.75C12.4142 17.75 12.75 17.4142 12.75 17H11.25ZM7 11.25C6.58579 11.25 6.25 11.5858 6.25 12C6.25 12.4142 6.58579 12.75 7 12.75V11.25ZM17 12.75C17.4142 12.75 17.75 12.4142 17.75 12C17.75 11.5858 17.4142 11.25 17 11.25V12.75ZM11.25 7V17H12.75V7H11.25ZM7 12.75H17V11.25H7V12.75Z"
              fill="#001A72"
            />
          </svg>
        </IconButton>
      </Box>
    </Box>
  );
};

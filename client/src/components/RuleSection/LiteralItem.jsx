import { Delete, Lock, LockOpen } from "@mui/icons-material";
import { Box, ClickAwayListener, Typography } from "@mui/material";
import { Fragment, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { ContextMenu } from "../../../../../components";
import { findCollection } from "../../../../../utils/workspace";
import { parseLiteral } from "./literalParser";
import { RuleMenu } from "./RuleMenu";

const isMathForm = true;

export const LiteralItem = ({
  literal,
  indexR,
  indexC,
  indexL,
  setRules,
  rules,
}) => {
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLockedMenu, setShowLockedMenu] = useState(false);
  const [coord, setCoord] = useState({ xPos: 0, yPos: 0 });
  const [parsing, setParsing] = useState(false);
  const literalLockedMenuItem = [
    {
      name: "Unlock",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14.8385 5.34315C15.028 5.71146 15.4802 5.85641 15.8486 5.6669C16.2169 5.47738 16.3618 5.02517 16.1723 4.65685L14.8385 5.34315ZM5 21H4.25C4.25 21.4142 4.58579 21.75 5 21.75V21ZM19 21V21.75C19.4142 21.75 19.75 21.4142 19.75 21H19ZM19 11H19.75C19.75 10.5858 19.4142 10.25 19 10.25V11ZM5 11V10.25C4.58579 10.25 4.25 10.5858 4.25 11H5ZM8.75 11V7H7.25V11H8.75ZM8.75 7C8.75 6.45335 8.92016 5.61668 9.40865 4.93823C9.8696 4.29802 10.6444 3.75 12 3.75V2.25C10.1556 2.25 8.9304 3.03532 8.19135 4.06177C7.47984 5.04998 7.25 6.21332 7.25 7H8.75ZM12 3.75C13.5991 3.75 14.4125 4.51517 14.8385 5.34315L16.1723 4.65685C15.5181 3.38547 14.2215 2.25 12 2.25V3.75ZM5 21.75H19V20.25H5V21.75ZM19.75 21V11H18.25V21H19.75ZM4.25 11V21H5.75V11H4.25ZM8 10.25H5V11.75H8V10.25ZM19 10.25H8V11.75H19V10.25Z"
            fill="#000000"
          />
        </svg>
      ),
      handleClick: () => {
        literal.locked = false;
        let temp = JSON.parse(JSON.stringify(rules));
        temp[indexR].clauses[indexC].literals[indexL].locked = false;
        setRules(temp);
        setShowLockedMenu(false);
      },
    },
  ];
  const literalMenuItems = [
    {
      name: "Delete",
      icon: <Delete />,
      handleClick: () => {
        if (literal.new) {
          let temp = JSON.parse(JSON.stringify(rules));
          temp[indexR].clauses[indexC].literals.splice(indexL, 1);
          setRules(temp);
          return;
        }
        literal.deleted = true;
        let temp = JSON.parse(JSON.stringify(rules));
        temp[indexR].clauses[indexC].literals[indexL].deleted = true;
        setRules(temp);
        setShowMenu(false);
      },
    },
    {
      name: "Lock",
      icon: <Lock />,
      handleClick: () => {
        // literal.locked = !literal.locked;
        // rules[indexR].clauses[indexC].literals[indexL].locked = !rules[indexR].clauses[indexC].literals[indexL].locked;
        literal.locked = true;
        let temp = JSON.parse(JSON.stringify(rules));
        temp[indexR].clauses[indexC].literals[indexL].locked = true;
        setRules(temp);
        setShowMenu(false);
      },
    },
  ];

  useEffect(() => {
    if (isMathForm) {
      setValue(literal.literal);
    } else setValue(literal.naturalValue);
  }, [literal]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCoord({ xPos: e.pageX + "px", yPos: e.pageY + "px" });
    if (literal.locked) {
      setShowLockedMenu(true);
    } else {
      setShowMenu(true);
    }
  };

  const handleValueChange = (e) => {
    setValue(e.target.value);
    let temp = JSON.parse(JSON.stringify(rules));
    // console.log(`(${indexR}, ${indexC}, ${indexL})original: ${temp[indexR].clauses[indexC].literals[indexL].naturalValue}; new: ${e.target.value}`);
    if (isMathForm) {
      temp[indexR].clauses[indexC].literals[indexL].literal = e.target.value;
    } else
      temp[indexR].clauses[indexC].literals[indexL].naturalValue =
        e.target.value;
    setRules(temp);
  };

  const handleDoubleClick = () => {
    if (!literal.locked) {
      setEditing(true);
    }
  };

  const handleClickAway = () => {
    setParsing(true);
    // close menu
    setEditing(false);
    if (!isMathForm) {
      // generate literal from natural value
      let newClause = parseLiteral(
        literal.naturalValue,
        currCollection
          ? currCollection.objectList
            ? currCollection.objectList
            : []
          : [],
        JSON.parse(JSON.stringify(rules[indexR].clauses[indexC])),
        indexL,
      );
      // update clause
      if (newClause) {
        let temp = JSON.parse(JSON.stringify(rules));
        temp[indexR].clauses[indexC] = newClause;
        setRules(temp);
      }
    }
    setParsing(false);
  };

  return (
    <Fragment>
      <RuleMenu
        showMenu={showMenu}
        setShowMenu={setShowMenu}
        x={coord.xPos}
        y={coord.yPos}
        menuItems={literalMenuItems}
      >
        default
      </RuleMenu>
      <RuleMenu
        showMenu={showLockedMenu}
        setShowMenu={setShowLockedMenu}
        x={coord.xPos}
        y={coord.yPos}
        menuItems={literalLockedMenuItem}
      >
        unlock menu
      </RuleMenu>
      {/* {`${indexR}, ${indexC}, ${indexL}`} */}
      {editing ? (
        <ClickAwayListener onClickAway={handleClickAway}>
          <Box
            component="textarea"
            value={value}
            onChange={handleValueChange}
            sx={{
              fontFamily: "Helvetica",
              fontSize: "14px",
              color: "purple.dark",
              height: "26px",
              p: "3px",
            }}
          />
        </ClickAwayListener>
      ) : (
        <Box
          sx={{ boxSizing: "border-box", maxWidth: "100%" }}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        >
          <LiteralChip literal={literal} isParsing={parsing} />
        </Box>
      )}
    </Fragment>
  );
};

const LiteralChip = ({ literal, isParsing }) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: "5px",
        boxSizing: "border-box",
        backgroundColor: "white",
        maxWidth: "100%",
        overflow: "hidden",
        border: `3px solid ${!literal.literal ? "rgba(255, 37, 23, 0.7)" : literal.locked ? "rgba(11, 164, 54, 0.84)" : "white"}`,
        p: "5px 16px 5px 16px",
      }}
    >
      <Typography
        sx={{
          maxWidth: "100%",
          overflow: "hidden",
          boxSizing: "border-box",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isParsing
          ? "Parsing..."
          : isMathForm
            ? literal.literal
            : literal.naturalValue}
      </Typography>
    </Box>
  );
};

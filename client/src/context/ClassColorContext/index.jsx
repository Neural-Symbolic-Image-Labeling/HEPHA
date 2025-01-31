import React, { createContext, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { chartColors } from "../../utils/chart";
import { findCollection } from "../../utils/workspace";

const ClassColorContext = createContext(null);

export const ClassColorProvider = ({ children }) => {
  const workspace = useSelector((state) => state.workspace.workspace);
  const currCollectionId = useSelector(
    (state) => state.workspace.currCollectionId,
  );
  const currCollection = findCollection(workspace, currCollectionId);
  const [colors, setColors] = useState({});

  useEffect(() => {
    if (!currCollection?.rules) return;
    const newColors = {};
    currCollection.rules.forEach((rule, index) => {
      newColors[rule.name] = chartColors[index % chartColors.length];
    });
    setColors(newColors);
  }, []);

  useEffect(() => {
    if (!currCollection?.rules) return;
    const newColors = {};
    currCollection.rules.forEach((rule, index) => {
      newColors[rule.name] = chartColors[index % chartColors.length];
    });
    setColors(newColors);
  }, [currCollection?.rules]);

  return (
    <ClassColorContext.Provider value={{ colors }}>
      {children}
    </ClassColorContext.Provider>
  );
};

export const useClassColor = () => {
  return useContext(ClassColorContext);
};

import React, { createContext, useEffect, useState } from "react";
import { fabric } from "fabric";
import ToolList from "./Tools/ToolList";
import { RectangleTool } from "./Tools/Rectangle/Rectangle";
import { SelectedTool } from "./Tools/Select/SelectTool";

/** @type {React.Context<[fabric.Canvas, string, (c: fabric.Canvas) => void, (t: any) => void, (p: any) => void]>}*/
export const FabricContext = createContext(null);

const defaultProps = {
  canvasHeight: 600,
  canvasWidth: 1200,
  canvasBackgroundColor: "#66ccff",
  lineWidth: 1,
  fillColor: "#bd2b33",
  lineColor: "#000000",
};
const tools = {};
export const FabricProvider = (props) => {
  /**@type {[fabric.Canvas, (c: fabric.Canvas) => void]} */
  const [fbCanvas, setFbCnavas] = useState(null);
  /**@type {[string, (t: string) => void]} */
  const [currTool, setCurrTool] = useState(ToolList.RectangleTool);

  const [canvasProps, setCanvasProps] = useState(defaultProps);

  //#region Helpers

  /** Initialize fabric canvas
   * @param {fabric.Canvas} canvas
   */
  const initCanvas = (canvasRef) => {
    console.log("FabricProvider.initCanvas");
    if (fbCanvas) return;
    setFbCnavas(
      new fabric.Canvas(canvasRef.current, {
        // preserveObjectStacking: false,
        // renderOnAddRemove: false,
        // skipTargetFind: true
      }),
    );
    // canvasRef.current.remove();
  };

  const setTool = (tool) => {
    setCurrTool(tool);
  };

  const setProps = (props) => {
    setCanvasProps((p) => ({ ...p, ...props }));
  };

  const handleEvent = (e, callback) => {
    if (!fbCanvas || !currTool) return;
    callback(e);
  };

  const _onMouseDown = (e) => {
    tools[currTool].onMouseDown(e);
    console.log("_onMouseDown", currTool);
  };

  const _onMouseMove = (e) => {
    tools[currTool].onMouseMove(e);
    console.log("_onMouseMove", currTool);
  };

  const _onMouseUp = (e) => {
    tools[currTool].onMouseUp(e);
    console.log("_onMouseUp", currTool);
  };

  //#endregion

  //#region useEffects
  useEffect(() => {
    if (!fbCanvas) return;
    fbCanvas.setBackgroundColor(canvasProps.canvasBackgroundColor);
    fbCanvas.setDimensions({
      width: canvasProps.canvasWidth,
      height: canvasProps.canvasHeight,
    });
    fbCanvas.renderAll();

    if (currTool) tools[currTool].configureCanvas(canvasProps);
  }, [canvasProps]);

  useEffect(() => {
    console.log("FabricProvider.useEffect");
  }, [canvasProps]);

  useEffect(() => {
    if (!fbCanvas) return;

    console.log("create canvas", fbCanvas);
    fbCanvas.setBackgroundColor(canvasProps.canvasBackgroundColor);
    fbCanvas.setDimensions({
      width: canvasProps.canvasWidth,
      height: canvasProps.canvasHeight,
    });
    fbCanvas.renderAll();

    tools[ToolList.RectangleTool] = new RectangleTool(fbCanvas);
    tools[ToolList.SelectedTool] = new SelectedTool(fbCanvas);

    if (currTool) tools[currTool].configureCanvas(canvasProps);

    fbCanvas.on("mouse:down", (e) => {
      handleEvent(e, _onMouseDown);
    });
    fbCanvas.on("mouse:move", (e) => {
      handleEvent(e, _onMouseMove);
    });
    fbCanvas.on("mouse:up", (e) => {
      handleEvent(e, _onMouseUp);
    });

    return () => {
      fbCanvas.dispose();
    };
  }, [fbCanvas]);

  useEffect(() => {
    if (!fbCanvas) return;
    console.log("setTool", currTool);
    tools[currTool].configureCanvas(canvasProps);
    fbCanvas.off();
    fbCanvas.on("mouse:down", (e) => {
      handleEvent(e, _onMouseDown);
    });
    fbCanvas.on("mouse:move", (e) => {
      handleEvent(e, _onMouseMove);
    });
    fbCanvas.on("mouse:up", (e) => {
      handleEvent(e, _onMouseUp);
    });
    fbCanvas.renderAll();
  }, [currTool]);

  //#endregion

  return (
    <FabricContext.Provider
      value={[fbCanvas, currTool, initCanvas, setTool, setProps]}
    >
      {props.children}
    </FabricContext.Provider>
  );
};

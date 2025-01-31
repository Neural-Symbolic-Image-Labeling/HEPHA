import { useContext, useEffect, useRef } from "react";
import { FabricContext } from "../context/FabricContext";
import ToolList from "../context/FabricContext/Tools/ToolList";
import { Container } from "@mui/material";

export const CanvasField = () => {
  const canvasRef = useRef(null);
  const [canvas, currTool, initCanvas, setTool, setProps] =
    useContext(FabricContext);

  useEffect(() => {
    initCanvas(canvasRef);
    console.log(canvasRef);
  }, []);

  const test = () => {
    setProps({ canvasBackgroundColor: "#a8e4f7" });
  };

  return (
    <>
      <div>
        <p>{`Current Tool: ${currTool}`}</p>
        <button onClick={() => setTool(ToolList.RectangleTool)}>Rect</button>
        <button onClick={() => setTool(ToolList.SelectedTool)}>Select</button>
        <button onClick={() => test()}>Test</button>
        <div>{canvas && JSON.stringify(canvas.toJSON())}</div>
      </div>
      <Container>
        <canvas ref={canvasRef}></canvas>
      </Container>
    </>
  );
};

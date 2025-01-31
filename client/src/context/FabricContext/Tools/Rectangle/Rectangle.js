import { Tool } from "../Tool";
import { fabric } from "fabric";

export class RectangleTool extends Tool {
  name = "RectangleTool";

  /**
   * @param {{
   * lineWidth: number,
   * fillColor: string,
   * lineColor: string,
   * }} props
   */
  configureCanvas = (props) => {
    console.log("RectangleTool.configureCanvas");

    let canvas = this.fbCanvas;
    canvas.isDrawingMode = false;
    canvas.forEachObject((obj) => {
      obj.set("selectable", false);
      obj.set("hasControls", false);
    });
    this._width = props.lineWidth;
    this._color = props.lineColor;
    this._fill = props.fillColor;
    canvas.renderAll();
  };

  /** Create new rectangle when mouse is down
   * @param {fabric.IEvent<MouseEvent>} o
   */
  onMouseDown = (o) => {
    // console.log("RectangleTool.onMouseDown");
    if (this.isDown) return;
    let canvas = this.fbCanvas;
    this.isDown = true;
    let pointer = canvas.getPointer(o.e);
    this.startX = pointer.x;
    this.startY = pointer.y;
    // create rectangle
    const temp = new fabric.Rect({
      left: this.startX,
      top: this.startY,
      // originX: 'left',
      // originY: 'top',
      width: pointer.x - this.startX,
      height: pointer.y - this.startY,
      stroke: this._color,
      strokeWidth: this._width,
      fill: this._fill,
      selectable: false,
      hasControls: false,
      // transparentCorners: false,
      evented: false,
      // strokeUniform: true,
      // noScaleCache: false,
      // angle: 0,
    });
    this.rect = temp;

    // add to canvas
    temp.setCoords();
    canvas.add(temp);
    // console.log(temp);
    // canvas.setActiveObject(this.rect);
    canvas.renderAll();
  };

  // adjust rectangle when mouse is moving
  onMouseMove = (o) => {
    // console.log("RectangleTool.onMouseMove");
    if (!this.isDown) return;
    let canvas = this.fbCanvas;
    let pointer = canvas.getPointer(o.e);
    if (this.startX > pointer.x) {
      this.rect.set({ left: Math.abs(pointer.x) });
    }
    if (this.startY > pointer.y) {
      this.rect.set({ top: Math.abs(pointer.y) });
    }
    this.rect.set({ width: Math.abs(this.startX - pointer.x) });
    this.rect.set({ height: Math.abs(this.startY - pointer.y) });
    this.rect.setCoords();
    canvas.renderAll();
  };

  /** Finish rectangle when mouse is up.
   * @param {fabric.IEvent<MouseEvent>} o
   */
  onMouseUp = (o) => {
    // console.log("RectangleTool.onMouseUp");
    let canvas = this.fbCanvas;
    this.isDown = false;
    this.rect.setCoords();
    canvas.setActiveObject(this.rect);
    canvas.renderAll();
  };
}

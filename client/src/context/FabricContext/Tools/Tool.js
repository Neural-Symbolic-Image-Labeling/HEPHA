import { fabric } from "fabric";

export class Tool {
  name = "Tool";

  /**
   * @param {fabric.Canvas} fbCanvas
   */
  constructor(fbCanvas) {
    this.fbCanvas = fbCanvas;
  }

  /**
   * @param {{
   * lineWidth: number,
   * fillColor: string,
   * lineColor: string,
   * }} props
   */
  configureCanvas = (props) => {};

  onMouseDown = (e) => {};

  onMouseMove = (e) => {};

  onMouseUp = (e) => {};

  onMouseLeave = (e) => {};
}

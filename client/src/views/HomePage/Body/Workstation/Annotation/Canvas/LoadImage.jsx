import React, { useState, useEffect } from "react";
import { Image } from "react-konva";
import { v1 as uuid } from "uuid";
import { getImageInterpretation } from "../../../../../../apis/image";
import { getImageMask } from "../../../../../../apis/image";

const LoadImage = ({
  imageUrl,
  imageId,
  onMouseDown,
  setOffsetY,
  allLabels,
  setAllLabels,
  mask,
}) => {
  // const [image] = useImage(imageUrl);
  // return <Image  onLoad = {() => {console.log(1111111)}}image={image}  onMouseDown={onMouseDown} width = {900} height = {600}/>;
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (mask) {
      imageUrl =
        imageUrl.split("/img/")[0] + "/img/mask/" + imageUrl.split("/img/")[1];
      loadImage();
    } else {
      loadImage();
    }
  }, []);

  function loadImage() {
    const image = new window.Image();
    image.src = imageUrl;
    image.onload = () => {
      const { naturalHeight, naturalWidth } = image;
      if (naturalWidth > naturalHeight) {
        let ratioW =
          naturalWidth >= 900
            ? 1 - (naturalWidth - 900) / naturalWidth
            : (900 - naturalWidth) / naturalWidth + 1;
        image.width = Math.ceil(naturalWidth * ratioW);
        image.height = Math.ceil(naturalHeight * ratioW);
        image.alt = [
          Math.ceil(450 - (naturalWidth * ratioW) / 2),
          Math.ceil(300 - (naturalHeight * ratioW) / 2),
        ];
        if (image.height > 600) {
          let ratio =
            naturalHeight >= 600
              ? 1 - (naturalHeight - 600) / naturalHeight
              : (600 - naturalHeight) / naturalHeight + 1;
          image.width = Math.ceil(naturalWidth * ratio);
          image.height = Math.ceil(naturalHeight * ratio);
          image.alt = [
            Math.ceil(450 - (naturalWidth * ratio) / 2),
            Math.ceil(300 - (naturalHeight * ratio) / 2),
          ];
        }
      } else {
        let ratioH =
          naturalHeight >= 600
            ? 1 - (naturalHeight - 600) / naturalHeight
            : (600 - naturalHeight) / naturalHeight + 1;
        image.width = Math.ceil(naturalWidth * ratioH);
        image.height = Math.ceil(naturalHeight * ratioH);
        image.alt = [
          Math.ceil(450 - (naturalWidth * ratioH) / 2),
          Math.ceil(300 - (naturalHeight * ratioH) / 2),
        ];
      }
      setImage(image);
      setOffsetY(Number(image.alt.split(",")[1]));

      //From interpretation
      // const reformatLables = allLabels;
      if (mask === false) {
        const reformatLables = [];
        getImageInterpretation(imageId).then((res) => {
          console.log(res);
          if (res) {
            const interpretation = Object.keys(res["object"]).map(
              (key) => res["object"][key],
            );
            const resizeRatio = image.height / image.naturalHeight;
            for (const item of interpretation) {
              const xmin =
                item["coordinate"][0] * resizeRatio +
                Number(image.alt.split(",")[0]);
              const ymin =
                item["coordinate"][1] * resizeRatio +
                Number(image.alt.split(",")[1]);
              const xmax =
                item["coordinate"][2] * resizeRatio +
                Number(image.alt.split(",")[0]);
              const ymax =
                item["coordinate"][3] * resizeRatio +
                Number(image.alt.split(",")[1]);
              reformatLables.push({
                name: item["name"],
                id: uuid(),
                x: xmin,
                y: ymin,
                width: xmax - xmin,
                height: ymax - ymin,
              });
            }
          }
        });
        setAllLabels(reformatLables);
      }
    };
  }
  return (
    1,
    (
      <Image
        image={image}
        onMouseDown={onMouseDown}
        x={image === null ? 0 : Number(image.alt.split(",")[0])}
        y={image === null ? 0 : Number(image.alt.split(",")[1])}
        opacity={mask ? 0.3 : 1}
      ></Image>
    )
  );
};

export default LoadImage;

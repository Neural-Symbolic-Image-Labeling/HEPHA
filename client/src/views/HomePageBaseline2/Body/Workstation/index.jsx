import { Fragment, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPage } from "../../../../stores/workstation";
import { Gallery } from "./Gallery";
import { Annotation } from "./Annotation";
import { Button } from "@mui/material";
import { findCollection } from "../../../../utils/workspace";

/**Workstation Wrapper
 * The Workstation section controls the rendering of gallery or annotation page.
 */
export const Workstation = () => {
  const page = useSelector((state) => state.workstation.page);
  const dispatch = useDispatch();
  const [allLabels, setAllLabels] = useState([]);

  const [imgPurgeInfo, setImgPurgeInfo] = useState({
    enable: false,
    markedImgs: [],
    dataset: "",
  });

  const setPageNum = (pageNum) => {
    dispatch(setPage(pageNum));
  };
  const getPageContent = (pageNum) => {
    switch (pageNum) {
      case 1:
        return (
          <Annotation
            setPage={setPageNum}
            allLabels={allLabels}
            setAllLabels={setAllLabels}
            imgPurgeInfo={imgPurgeInfo}
            setImgPurgeInfo={setImgPurgeInfo}
          />
        );
      default:
        return (
          <Gallery
            setPage={setPageNum}
            allLabels={allLabels}
            setAllLabels={setAllLabels}
            imgPurgeInfo={imgPurgeInfo}
            setImgPurgeInfo={setImgPurgeInfo}
          />
        );
    }
  };

  return (
    <Fragment>
      {imgPurgeInfo.enable && (
        <Button
          variant="contained"
          color="warning"
          onClick={() => {
            alert(JSON.stringify(imgPurgeInfo));
          }}
        >
          Generate Purged Image JSON
        </Button>
      )}
      {getPageContent(page)}
    </Fragment>
  );
};

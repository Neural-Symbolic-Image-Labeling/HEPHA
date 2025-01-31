import { Fragment, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPage } from "../../../../stores/workstation";
import { Gallery } from "./Gallery";
import { Annotation } from "./Annotation";

/**Workstation Wrapper
 * The Workstation section controls the rendering of gallery or annotation page.
 */
export const Workstation = () => {
  const page = useSelector((state) => state.workstation.page);
  const dispatch = useDispatch();
  const [allLabels, setAllLabels] = useState([]);

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
          />
        );
      default:
        return (
          <Gallery
            setPage={setPageNum}
            allLabels={allLabels}
            setAllLabels={setAllLabels}
          />
        );
    }
  };

  return <Fragment>{getPageContent(page)}</Fragment>;
};

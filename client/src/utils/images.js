export const getImageType = (imgMetaData) => {
  if (!imgMetaData.labels || imgMetaData.labels.length === 0) {
    return "unlabeled";
  }
  let hasUnlabeled = false;
  let hasConflit = false;
  let hasManual = false;
  let hasAuto = false;
  for (let l of imgMetaData.labels) {
    if (l.name.length > 1) {
      hasConflit = true;
      break;
    } else if (!l.name || l.name.length === 0) {
      hasUnlabeled = true;
    } else if (l.confirmed) {
      hasManual = true;
    } else {
      hasAuto = true;
    }
  }
  if (hasUnlabeled) {
    return "unlabeled";
  }
  if (hasConflit) {
    return "conflict";
  } else if (hasAuto) {
    return "auto";
  }

  return "manual";
};

export const getDisplayedImagesMetaData = (collection, filterImages) => {
  if (!collection) return [];
  const result = [];
  for (let imgId of filterImages) {
    const img = collection.images.find((i) => i.imageId === imgId);
    if (img) {
      result.push(img);
    }
  }
  return result;
};

export const filterAndSortImages = (collection, filters) => {
  if (!collection) return [];
  let tracker = collection.imageOrder.map((imgId) =>
    collection.images.find((i) => i.imageId === imgId),
  );
  tracker = labelFilter(tracker, filters.label);
  tracker = typeFilter(tracker, filters.type);
  return tracker.map((i) => i.imageId);
};

const labelFilter = (traker, filterStr) => {
  if (!filterStr) return traker;
  const result = [];
  for (let img of traker) {
    let flag = false;
    for (let l of img.labels) {
      for (let n of l.name) {
        if (n.toLowerCase().includes(filterStr.toLowerCase())) {
          flag = true;
          break;
        }
      }
    }
    if (flag) {
      result.push(img);
    }
  }
  return result;
};

const typeFilter = (traker, filterStr) => {
  if (!filterStr) return traker;
  const result = [];
  for (let img of traker) {
    let type = getImageType(img);
    if (type === filterStr) {
      result.push(img);
    }
  }
  return result;
};

export const calculateAccuracy = (currCollection) => {
  if (!currCollection?.images) return null;
  const images = currCollection.images;
  // count correct labels
  let correct = 0;
  for (let img of images) {
    if (
      img.labels.length === 1 &&
      img.labels[0].name.length === 1 &&
      img.trueLabel.toLowerCase() === img.labels[0].name[0].toLowerCase()
    )
      correct++;
  }
  return correct / images.length;
};

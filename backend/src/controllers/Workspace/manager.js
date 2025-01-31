const { mongoose } = require('mongoose');
const { ImageSet, Image } = require('../../models/Image');
const { get, post } = require('../../utils/http');

function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const imageUrlParser = (uuid) => {
  return `${process.env.BE_URL}:${process.env.BE_PORT}/api/img/${uuid}`;

};

const collectionBuilder = async (imgSetDoc) => {

  const images = imgSetDoc && imgSetDoc.images.length > 0 ? await Promise.all(imgSetDoc.images.map(async (imgId, index) => {
    const imgData = await Image.findById(imgId).select('attributes label').lean();
    return {
      imageId: imgId.toString(),
      url: imageUrlParser(imgId.toString()),
      name: `${index}.PNG`,
      labels: [],
      attributes: imgData.attributes,
      labeled: false,
      manual: false,
      trueLabel: imgData.label,
    }
  })) : [];
  const collection = {
    ...imgSetDoc,
    statistics: {
      total: images.length,
      unlabeled: images.length,
      manual: 0,
      autoLabeled: 0,
      accuracy: 0.0,
      label_coverage: {}
    },
    images: shuffle(images),
    imageOrder: images.map(i => i.imageId),
    al_imageOrder: [],
    rules: [],
    birdPredicates: {},
    num_object_list: [],
    area_object_list: [],
    restrictions: {
      deleted: null,
      locked: null,
    },
  };
  return collection;
}

/** Create a new workspace 
 * @param {string} name 
 * @returns {Promise<import('../../models/Workspace').IWorkspaceSchema>}
 */
const createWorkspace = async (name) => {
  const data = await ImageSet.findOne();
  const collection = await collectionBuilder(data);
  const result = {
    name: name,
    collections: [],
    logs: [],
  }
  result.collections.push(collection);
  return result;
}

const requestLabel = async (workspaceId, collectionId, mode, test_img_ids, task, rule = {}, image_set_name = "", active_learning = true) => {
  const reqBody = {
    workspaceID: workspaceId,
    collectionID: collectionId,
    mode: mode,
    task: task,
    rule: rule,
    image_set_name: image_set_name,
    active_learning: active_learning,
    test_img_ids: test_img_ids
  }
  return post(`/autolabel`, reqBody);
}

// const requestBaselineLabel = async (workspaceId, collectionId, mode, task, imgSetName) => { 
//   const reqBody = {
//     workspaceID: workspaceId,
//     collectionID: collectionId,
//     mode: mode,
//     task: 'baseline',
//     image_set_name: imgSetName,
//   }
//   return post(`/run_baseline`, reqBody);
// }

const requestBaselineLabel = async (workspaceId, collectionId, mode, test_img_ids, imgSetName, resnet_model) => {
  const reqBody = {
    workspaceID: workspaceId,
    collectionID: collectionId,
    mode: mode,
    task: 'baseline',
    image_set_name: imgSetName,
    resnet_model: resnet_model,
    test_img_ids: test_img_ids
  }
  return post(`/run_resnet`, reqBody);
}

module.exports = {
  createWorkspace,
  collectionBuilder,
  requestLabel,
  requestBaselineLabel
}
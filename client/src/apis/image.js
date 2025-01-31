import { get, post, deleteMethod, put, postMultiPart } from "./axios";

export const autoAuth = () => {
  return get("/img/auto");
};
export const authDashboard = (token) => {
  return post("/img/auth", { token: token });
};
export const createImageSet = (name) => {
  return post("/img/set", { name: name });
};
export const getAllSetNames = () => {
  return get("/img/setNames");
};
export const uploadImage = (imageData, imgSetName) => {
  return post("/img", { data: imageData, imageSetName: imgSetName });
};
export const deleteAllImages = () => {
  return deleteMethod("/img/all");
};

export const getImageInterpretation = (imgId) => {
  return get(`/img/interpretation/${imgId}`);
};

export const getImageMask = (imgId) => {
  return get(`/img/mask/${imgId}`);
};

export const uploadImageSetByJSONFiles = (formData) => {
  return postMultiPart("/img/setByJSON", formData);
};

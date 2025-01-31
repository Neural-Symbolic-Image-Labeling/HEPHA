const { post } = require("../../utils/http")

const requestForInterpretation = async (imgId) => { 
  return post(`/img/pre/${imgId}`);
}

module.exports = {
  requestForInterpretation
}
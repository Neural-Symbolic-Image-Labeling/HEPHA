const axios = require('axios').default;

const instance = axios.create({
  baseURL: `${process.env.AI_URL}:${process.env.AI_PORT}/api`,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 6000000,
});
console.log(`${process.env.AI_URL}:${process.env.AI_PORT}/api`);

const get = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    instance.get(url, {params: params})
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

const post = (url, data) => { 
  return new Promise((resolve, reject) => {
    instance.post(url, data)
      .then((response) => {
        resolve(response.data);
      },
        (err) => {
          reject(err);
        }
      );
  });
}

module.exports = {
  get,
  post,
}
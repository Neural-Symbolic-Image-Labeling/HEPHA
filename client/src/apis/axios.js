import axios from "axios";

console.log(
  import.meta.env.VITE_API_URL + ":" + import.meta.env.VITE_API_PORT + "/api",
);
const instance = axios.create({
  baseURL:
    `${import.meta.env.VITE_API_URL}:${import.meta.env.VITE_API_PORT}/api` ||
    "http://localhost:8888/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 2400000,
  withCredentials: true,
});

const axiosConfig = {
  withCredentials: true,
};

export function get(url, params = {}, config = {}) {
  config = { ...config, params: params };
  return new Promise((resolve, reject) => {
    instance
      .get(url, { params: params }, Object.assign(axiosConfig, config))
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function post(url, data = {}, config = {}) {
  return new Promise((resolve, reject) => {
    instance.post(url, data, Object.assign(axiosConfig, config)).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      },
    );
  });
}

export function postMultiPart(url, data = {}, config = {}) {
  return new Promise((resolve, reject) => {
    instance
      .post(
        url,
        data,
        Object.assign(axiosConfig, config, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      )
      .then(
        (response) => {
          resolve(response.data);
        },
        (err) => {
          reject(err);
        },
      );
  });
}

export function put(url, data = {}, config = {}) {
  return new Promise((resolve, reject) => {
    instance.put(url, data, Object.assign(axiosConfig, config)).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      },
    );
  });
}

export function deleteMethod(url, param = {}, config = {}) {
  return new Promise((resolve, reject) => {
    instance.delete(url, param, Object.assign(axiosConfig, config)).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      },
    );
  });
}

export function patch(url, data = {}, config = {}) {
  return new Promise((resolve, reject) => {
    instance.patch(url, data, Object.assign(axiosConfig, config)).then(
      (response) => {
        resolve(response.data);
      },
      (err) => {
        reject(err);
      },
    );
  });
}

UNIVERSAL NRG-CO HEADER BLOCK
Use this exact banner at the top of source files. License/covenant terms still apply.

################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  response => {
    if (!response.data || Object.keys(response.data).length === 0) {
      return Promise.reject(new Error('Empty response'));
    }
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
      throw new Error('Request timeout');
    }
    if (!error.response) {
      throw new Error('Cannot connect to server');
    }
    throw error;
  }
);

export { api, API, BACKEND_URL };
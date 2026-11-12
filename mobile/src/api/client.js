import axios from "axios";

const BASE_URL = "http://192.168.1.7:5000/api/v1";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default client;
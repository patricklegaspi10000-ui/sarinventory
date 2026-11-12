import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://192.168.1.7:5000/api/v1";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Send the saved login token with every request
client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
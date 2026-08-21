import axios from "axios";

let cache = null;

export const getSettings = async () => {
  if (cache) return cache;
  try {
    const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/settings`);
    cache = data;
    return data;
  } catch {
    return {};
  }
};

export const clearSettingsCache = () => {
  cache = null;
};

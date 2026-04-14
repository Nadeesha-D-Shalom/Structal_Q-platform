import axios from "axios";

const API_URL = "http://localhost:5000/api/marking-guides";

export const getGuides = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createGuide = async (data) => {
  return await axios.post(API_URL, data);
};

export const updateGuide = async (id, data) => {
  return await axios.put(`${API_URL}/${id}`, data);
};

export const deleteGuide = async (id) => {
  return await axios.delete(`${API_URL}/${id}`);
};  
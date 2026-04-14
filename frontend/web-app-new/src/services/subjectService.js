import axios from "axios";

const API_URL = "http://localhost:5000/api/subjects";

export const getSubjects = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createSubject = async (data) => {
  return await axios.post(API_URL, data);
};

export const updateSubject = async (id, data) => {
  return await axios.put(`${API_URL}/${id}`, data);
};

export const deleteSubject = async (id) => {
  return await axios.delete(`${API_URL}/${id}`);
};
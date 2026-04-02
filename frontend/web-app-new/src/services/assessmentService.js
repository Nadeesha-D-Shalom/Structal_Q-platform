import axios from "axios";

const API_URL = "http://localhost:3000/api/assessments";

export const getAssessments = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const createAssessment = async (data) => {
  return await axios.post(API_URL, data);
};

export const updateAssessment = async (id, data) => {
  return await axios.put(`${API_URL}/${id}`, data);
};

export const deleteAssessment = async (id) => {
  return await axios.delete(`${API_URL}/${id}`);
};
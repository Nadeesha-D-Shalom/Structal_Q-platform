import axios from "axios";

const API = "http://localhost:3000/api/guide-questions";

export const getQuestions = () => axios.get(API);

export const createQuestion = (data) => axios.post(API, data);

export const updateQuestion = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const deleteQuestion = (id) =>
  axios.delete(`${API}/${id}`);
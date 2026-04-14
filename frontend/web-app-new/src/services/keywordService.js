import axios from "axios";

const API = "http://localhost:5000/api/question-keywords";

export const getKeywords = () => axios.get(API);

export const createKeyword = (data) => axios.post(API, data);

export const updateKeyword = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const deleteKeyword = (id) =>
  axios.delete(`${API}/${id}`);
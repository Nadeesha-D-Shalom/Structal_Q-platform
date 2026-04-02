import axios from "axios";

const API = "http://localhost:3000/api/guide-rubric";

export const getRubrics = () => axios.get(API);

export const createRubric = (data) =>
  axios.post(API, data);

export const updateRubric = (id, data) =>
  axios.put(`${API}/${id}`, data);

export const deleteRubric = (id) =>
  axios.delete(`${API}/${id}`);
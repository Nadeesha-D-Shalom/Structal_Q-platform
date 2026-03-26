import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/timetable',
});

export function createTimetable(data) {
  return api.post('/', data);
}

export function getTimetable() {
  return api.get('/');
}

export function updateTimetable(id, data) {
  return api.put(`/${id}`, data);
}


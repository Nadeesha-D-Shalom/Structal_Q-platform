import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import CreateTimetable from '../pages/CreateTimetable';
import ViewTimetable from '../pages/ViewTimetable';
import EditTimetable from '../pages/EditTimetable';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CreateTimetable />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/create" element={<CreateTimetable />} />
      <Route path="/view" element={<ViewTimetable />} />
      <Route path="/edit/:id" element={<EditTimetable />} />
    </Routes>
  );
}


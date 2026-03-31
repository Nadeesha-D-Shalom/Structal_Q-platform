import { Navigate, Route, Routes } from 'react-router-dom';
import CreateTimetable from '../pages/CreateTimetable';
import EditTimetable from '../pages/EditTimetable';
import LecturerViewTimetable from '../pages/LecturerViewTimetable';
import StudentViewTimetable from '../pages/StudentViewTimetable';

function resolveUserRole() {
  const directRole =
    localStorage.getItem('role') ||
    localStorage.getItem('userRole') ||
    localStorage.getItem('user_type');

  if (directRole) return String(directRole).toLowerCase();

  const rawUser = localStorage.getItem('user');
  if (!rawUser) return '';

  try {
    const parsed = JSON.parse(rawUser);
    return String(parsed?.role || parsed?.userRole || parsed?.type || '').toLowerCase();
  } catch {
    return '';
  }
}

function RoleBasedView() {
  const role = resolveUserRole();
  const isStudent = role.includes('student');
  return isStudent ? <StudentViewTimetable /> : <LecturerViewTimetable />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleBasedView />} />
      <Route path="/create" element={<CreateTimetable />} />
      <Route path="/view" element={<RoleBasedView />} />
      <Route path="/lecturer-view" element={<LecturerViewTimetable />} />
      <Route path="/student-view" element={<StudentViewTimetable />} />
      <Route path="/edit/:id" element={<EditTimetable />} />
      <Route path="*" element={<Navigate to="/view" replace />} />
    </Routes>
  );
}


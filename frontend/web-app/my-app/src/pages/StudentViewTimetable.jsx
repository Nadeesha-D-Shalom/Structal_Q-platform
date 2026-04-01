import ViewTimetableStudent from '../components/ViewTimetableStudent/ViewTimetableStudent';
import RolePageLayout from '../components/layout/RolePageLayout';

export default function StudentViewTimetable() {
  return (
    <RolePageLayout role="student" activePage="Timetable">
      <ViewTimetableStudent />
    </RolePageLayout>
  );
}


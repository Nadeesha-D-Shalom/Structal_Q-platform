import ViewTimetableLecturer from '../components/ViewTimetableLecturer/ViewTimetableLecturer';
import RolePageLayout from '../components/layout/RolePageLayout';

export default function LecturerViewTimetable() {
  return (
    <RolePageLayout role="lecturer" activePage="Timetable">
      <ViewTimetableLecturer />
    </RolePageLayout>
  );
}


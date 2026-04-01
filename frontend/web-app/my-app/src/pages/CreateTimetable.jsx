import CreateTimetableComponent from '../components/CreateTimetable/CreateTimetable';
import RolePageLayout from '../components/layout/RolePageLayout';

export default function CreateTimetable() {
  return (
    <RolePageLayout role="lecturer" activePage="Timetable">
      <CreateTimetableComponent />
    </RolePageLayout>
  );
}


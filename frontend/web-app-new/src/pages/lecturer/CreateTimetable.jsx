import CreateTimetableComponent from '../../components/CreateTimetable/CreateTimetable';
import LecturerNavbar from '../../components/navbars/LecturerNavbar';

export default function CreateTimetable() {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <LecturerNavbar activePage="Timetable" />
      <main className="px-[44px] pt-[34px] pb-[28px]">
        <CreateTimetableComponent />
      </main>
    </div>
  );
}

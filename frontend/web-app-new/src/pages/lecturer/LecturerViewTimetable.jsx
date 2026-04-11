import ViewTimetableLecturer from '../../components/ViewTimetableLecturer/ViewTimetableLecturer';
import LecturerNavbar from './LecturerNavbar';

export default function LecturerViewTimetable() {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <LecturerNavbar />
      <main className="px-[44px] pt-[34px] pb-[28px]">
        <ViewTimetableLecturer />
      </main>
    </div>
  );
}

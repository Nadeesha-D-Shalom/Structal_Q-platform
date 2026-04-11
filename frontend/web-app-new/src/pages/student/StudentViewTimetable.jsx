import ViewTimetableStudent from '../../components/ViewTimetableStudent/ViewTimetableStudent';
import StudentNavbar from '../../components/navbars/StudentNavbar';

export default function StudentViewTimetable() {
  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <StudentNavbar />
      <main className="px-[44px] pt-[34px] pb-[28px]">
        <ViewTimetableStudent />
      </main>
    </div>
  );
}

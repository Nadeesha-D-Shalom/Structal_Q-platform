import Navbar from '../components/Navbar/Navbar';
import CreateTimetableComponent from '../components/CreateTimetable/CreateTimetable';

export default function CreateTimetable() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <CreateTimetableComponent />
    </div>
  );
}


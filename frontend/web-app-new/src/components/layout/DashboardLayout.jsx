import LecturerNavbar from "./LecturerNavbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">

      {/* NAVBAR */}
      <LecturerNavbar activePage="Subjects" />

      {/* CONTENT */}
      <main className="flex-1 bg-gray-100 overflow-y-auto">
        {children}
      </main>

    </div>
  );
};

export default DashboardLayout;
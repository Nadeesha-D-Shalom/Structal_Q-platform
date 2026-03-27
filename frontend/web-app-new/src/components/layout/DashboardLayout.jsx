import Navbar from "./Navbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <Navbar />

      <div className="px-10 py-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
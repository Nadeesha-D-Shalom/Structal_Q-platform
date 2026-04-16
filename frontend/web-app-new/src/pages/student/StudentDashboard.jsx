import StudentNavbar from "./StudentNavbar";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "";

const StudentDashboard = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [sessionRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/session`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE}/api/dashboard/student/summary`, { headers: getAuthHeaders() }),
        ]);

        const sessionData = sessionRes.ok ? await sessionRes.json() : null;
        const summaryPayload = summaryRes.ok ? await summaryRes.json() : null;

        if (!mounted) return;
        setUser(sessionData);
        if (summaryPayload?.success) setSummary(summaryPayload.data);
      } catch {
        if (mounted) setSummary(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* Navbar */}
      <StudentNavbar />

      {/* Content */}
      <main className="px-[45px] pt-[30px]">

        {/* Header */}
        <h1 className="text-[22px] font-bold text-[#1b2b44]">
          Welcome, {user?.student_name || user?.name || user?.first_name || "Student"}
        </h1>
        <p className="text-[12px] text-[#7a8aa0] mb-5">
          Year 2 • Semester 1 • Student Portal
        </p>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-[18px] mb-5">

          {/* Card 1 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm relative">

            <div className="absolute top-3 right-3 text-[10px] bg-green-100 text-green-600 px-2 py-[2px] rounded-full">
              Updated
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-blue-100 text-blue-500 flex items-center justify-center rounded-md">
                <i className="fas fa-file text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">My Submissions</p>
            </div>

            <h2 className="text-[20px] font-bold">
              {loading ? "…" : summary?.my_submissions_count ?? 0}
            </h2>
            <p className="text-[11px] text-orange-500">
              {loading ? "" : `${summary?.active_concerns_count ?? 0} Pending Concern(s)`}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-purple-100 text-purple-500 flex items-center justify-center rounded-md">
                <i className="fas fa-book text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">Published Marks</p>
            </div>

            <h2 className="text-[20px] font-bold">
              {loading ? "…" : summary?.total_assignments ?? 0}
            </h2>
            <p className="text-[11px] text-gray-500">
              Published Marks
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border rounded-[14px] px-[18px] py-[14px] shadow-sm">

            <div className="flex items-center gap-3 mb-2">
              <div className="w-[34px] h-[34px] bg-red-100 text-red-500 flex items-center justify-center rounded-md">
                <i className="fas fa-exclamation-circle text-[12px]"></i>
              </div>
              <p className="text-[12px] text-gray-500">Active Concerns</p>
            </div>

            <h2 className="text-[20px] font-bold">
              {loading ? "…" : summary?.active_concerns_count ?? 0}
            </h2>
            <p className="text-[11px] text-gray-500">Active Concerns</p>
          </div>

        </div>

        {/* Bottom */}
        <div className="grid grid-cols-3 gap-[18px]">

          {/* Activity */}
          <div className="col-span-2 bg-white border rounded-[14px]">

            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="text-[13px] font-semibold flex items-center gap-2">
                <i className="fas fa-clock text-blue-500 text-[12px]"></i>
                Recent Activity
              </h2>
              <span className="text-[12px] text-blue-500">View All</span>
            </div>

            <div className="p-4 space-y-3 text-[12px]">

              {(summary?.recent_activities || []).length ? (
                summary.recent_activities.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.text}</p>
                      <p className="text-gray-400 text-[11px]">{item.time}</p>
                    </div>
                    <span className="text-gray-400 text-[10px]">{item.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-[12px]">No activities yet.</div>
              )}

            </div>
          </div>

          {/* Quick Actions */}
          <div>

            <h2 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
              <i className="fas fa-bolt text-orange-500 text-[12px]"></i>
              Quick Actions
            </h2>

            <div className="space-y-3">

              {[
                ["fa-upload", "Upload Submission", "/student/submissions"],
                ["fa-eye", "View Marks", "/student/marks"],
                ["fa-exclamation", "Raise Concern", "/student/raise-concern"],
              ].map((item, i) => (
                <Link
                  key={i}
                  to={item[2]}
                  className="bg-white border rounded-[12px] py-4 flex flex-col items-center text-[12px] shadow-sm hover:border-blue-200 transition-colors"
                >
                  <i className={`fas ${item[0]} text-blue-500 mb-1 text-[14px]`}></i>
                  {item[1]}
                </Link>
              ))}

            </div>

          </div>

        </div>

      </main>
    </div>
  );
};

export default StudentDashboard;
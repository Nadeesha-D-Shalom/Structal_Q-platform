import LecturerNavbar from "./LecturerNavbar";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "";

const LecturerDashboard = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30000);

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await fetch(`${API_BASE}/api/dashboard/lecturer/summary`, {
          headers: getAuthHeaders(),
          signal: controller.signal,
        });
        const payload = await res.json().catch(() => ({}));
        if (!mounted) return;
        if (!res.ok) {
          setLoadError(payload?.error || payload?.message || `Server error (${res.status})`);
          setSummary(null);
          return;
        }
        if (payload?.success) setSummary(payload.data);
        else {
          setLoadError(payload?.error || payload?.message || "Could not load dashboard.");
          setSummary(null);
        }
      } catch (e) {
        if (mounted) {
          setSummary(null);
          setLoadError(
            e?.name === "AbortError"
              ? "Request timed out. Check that the API is running and REACT_APP_API_URL is correct."
              : (e?.message || "Network error.")
          );
        }
      } finally {
        clearTimeout(t);
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* Navbar */}
      <LecturerNavbar />      
      {/* Main content */}
      <main className="px-[44px] pt-[34px] pb-[28px]">
        {/* Heading */}
        <section className="mb-[18px]">
          <h2 className="text-[23px] leading-[30px] font-bold text-[#18243d]">
            Lecturer Dashboard
          </h2>
          <p className="mt-[2px] text-[13px] text-[#74839a]">
            Quick overview of your current academic status.
          </p>
          {loadError && (
            <div
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800"
              role="alert"
            >
              {loadError}
            </div>
          )}
        </section>

        <section className="mb-[18px]">
          <h3 className="text-[13px] font-semibold text-[#24324a] mb-2">Quick links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[
              { to: "/lecturer/subjects", label: "Subjects", icon: "fa-book" },
              { to: "/lecturer/assignments", label: "Assignments", icon: "fa-tasks" },
              { to: "/lecturer/submissions", label: "Submissions", icon: "fa-inbox" },
              { to: "/lecturer/publish-marks", label: "Publish marks", icon: "fa-bullhorn" },
              { to: "/lecturer/review-concerns", label: "Concerns", icon: "fa-comments" },
              { to: "/lecturer/evaluation", label: "Evaluation schedule", icon: "fa-calendar-alt" },
              { to: "/lecturer/timetable", label: "Exam timetable", icon: "fa-table" },
              { to: "/lecturer/groups", label: "Groups", icon: "fa-users" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-3 rounded-[12px] border border-[#dde3eb] bg-white px-4 py-3 text-[13px] font-semibold text-[#24324a] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-[#3d6df2] hover:bg-[#f7f9ff] transition-colors"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#edf3ff] text-[#3c74ff]">
                  <i className={`fas ${item.icon}`} aria-hidden />
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Top stat cards */}
        <section className="flex flex-wrap justify-center gap-[18px] mb-[18px]">
          <div className="w-[240px] h-[86px] bg-white border border-[#dde3eb] rounded-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.12)] px-[20px] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#9aa8bb]">
                Pending Reviews
              </p>
              <h3 className="mt-[2px] text-[24px] font-bold text-[#18243d]">
                {loading ? "…" : summary?.pending_reviews_count ?? 0}
              </h3>
            </div>

            <div className="w-[38px] h-[38px] rounded-[11px] bg-[#edf3ff] flex items-center justify-center">
              <i className="far fa-clipboard text-[#3c74ff] text-[16px]"></i>
            </div>
          </div>

          <div className="w-[240px] h-[86px] bg-white border border-[#dde3eb] rounded-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.12)] px-[20px] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#9aa8bb]">
                High Risk Items
              </p>
              <h3 className="mt-[2px] text-[24px] font-bold text-[#18243d]">
                {loading ? "…" : summary?.high_risk_count ?? 0}
              </h3>
            </div>

            <div className="w-[38px] h-[38px] rounded-[11px] bg-[#fff0f0] flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-[#ff4d4f] text-[15px]"></i>
            </div>
          </div>

          <div className="w-[240px] h-[86px] bg-white border border-[#dde3eb] rounded-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.12)] px-[20px] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#9aa8bb]">
                Active Guides
              </p>
              <h3 className="mt-[2px] text-[24px] font-bold text-[#18243d]">
                {loading ? "…" : summary?.active_guides_count ?? 0}
              </h3>
            </div>

            <div className="w-[38px] h-[38px] rounded-[11px] bg-[#ebfbf1] flex items-center justify-center">
              <i className="far fa-bookmark text-[#1bb56d] text-[15px]"></i>
            </div>
          </div>
        </section>

        {/* Recent activities */}
        <section className="bg-white border border-[#d8dee8] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="h-[40px] px-[14px] flex items-center justify-between border-b border-[#edf1f5]">
            <h3 className="text-[14px] font-semibold text-[#24324a]">
              Recent Activities
            </h3>

            <button type="button" className="text-[12px] font-semibold text-[#3d6df2]">
              View History <span className="ml-1">→</span>
            </button>
          </div>

          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-3 px-[14px] pt-3 pb-1 text-[10px] font-bold tracking-[0.1em] uppercase text-[#9aa8bb] border-b border-[#f0f3f7]">
            <span>Subject</span>
            <span>Activity</span>
            <span className="text-right">When</span>
          </div>

          <div className="px-[14px] py-[12px]">
            <div className="space-y-[14px]">
              {(summary?.recent_activities || []).map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] gap-x-3 gap-y-1 items-start sm:items-center"
                >
                  <div className="flex items-center gap-2 min-w-0 order-2 sm:order-1">
                    <div
                      className={`w-[6px] h-[6px] rounded-full ${item.color} flex-shrink-0 sm:hidden`}
                    />
                    <p className="text-[12px] font-semibold text-[#3d4f6a] truncate" title={item.subject}>
                      {item.subject || "—"}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 min-w-0 order-1 sm:order-2 col-span-1 sm:col-span-1">
                    <div
                      className={`hidden sm:block w-[6px] h-[6px] rounded-full ${item.color} flex-shrink-0 mt-1.5`}
                    />
                    <p className="text-[13px] text-[#2e3b52] leading-snug">
                      {item.text}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.08em] text-[#9aa7bb] whitespace-nowrap text-left sm:text-right order-3">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LecturerDashboard;

import LecturerNavbar from "./LecturerNavbar";

const LecturerDashboard = () => {
  const activities = [
    {
      color: "bg-blue-500",
      text: "Submission by Group A - Advanced Machine Learning",
      time: "15 MINS AGO",
    },
    {
      color: "bg-green-500",
      text: "ML Analysis Completed for CS-402 Batch",
      time: "2 HOURS AGO",
    },
    {
      color: "bg-amber-500",
      text: "New Feedback requested for Software Architecture Draft",
      time: "5 HOURS AGO",
    },
    {
      color: "bg-slate-300",
      text: "Timetable update for Lab 302 (SE-301)",
      time: "YESTERDAY",
    },
    {
      color: "bg-slate-200",
      text: "Digital Office Hours Session Logged",
      time: "OCT 12, 2023",
    },
  ];

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
        </section>

        {/* Top stat cards */}
        <section className="flex justify-center gap-[18px] mb-[18px]">
          <div className="w-[240px] h-[86px] bg-white border border-[#dde3eb] rounded-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.12)] px-[20px] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.06em] uppercase text-[#9aa8bb]">
                Pending Reviews
              </p>
              <h3 className="mt-[2px] text-[24px] font-bold text-[#18243d]">
                12
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
                5
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
                3
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

            <button className="text-[12px] font-semibold text-[#3d6df2]">
              View History <span className="ml-1">→</span>
            </button>
          </div>

          <div className="px-[14px] py-[12px]">
            <div className="space-y-[16px]">
              {activities.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-[6px] h-[6px] rounded-full ${item.color} flex-shrink-0`}
                    ></div>
                    <p className="text-[13px] text-[#2e3b52] truncate">
                      {item.text}
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold tracking-[0.08em] text-[#9aa7bb] whitespace-nowrap ml-6">
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
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LecturerNavbar from "./LecturerNavbar";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const CompareWithGuide = () => {
  const [searchParams] = useSearchParams();
  const analysisId = searchParams.get("analysis_id");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (analysisId) fetchAnalysis();
  }, [analysisId]);

  const fetchAnalysis = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10">Loading ML Report...</div>;

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <LecturerNavbar />
      <div className="p-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <p className="text-[10px] sm:text-xs text-gray-400 mb-2">
          Home &gt; Analysis Reports &gt; ML Intelligence Report
        </p>

        {/* Title */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              ML Analysis Results
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Cross-comparison: Student Submission vs Lecturer Marking Guide
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-2xl text-xs font-medium hover:bg-gray-50 transition">
              <i className="fa-solid fa-rotate"></i>
              Re-run Analysis
            </button>
            <button className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-2xl text-xs font-semibold hover:bg-blue-700 transition shadow">
              <i className="fa-solid fa-download"></i>
              Export PDF
            </button>
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Similarity Score */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Similarity Score</p>
              <div className="text-red-500">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-gray-900">{Math.round((data?.similarity_avg || 0) * 100)}%</span>
              <span className="text-emerald-600 text-xs font-medium">↑15% from draft</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">High textual overlap detected</p>
          </div>

          {/* Structural Score */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Structural Score</p>
              <div className="text-orange-500">
                <i className="fa-solid fa-chart-line"></i>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl lg:text-5xl font-bold text-gray-900">{Math.round((data?.structural_similarity_avg || 0) * 100)}%</span>
              <span className="text-emerald-600 text-xs font-medium">↑8% improvement</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">Alignment with marking guide structure</p>
          </div>

          {/* Risk Level */}
          <div className="bg-white border border-red-200 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Level</p>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-600 rounded-full">ALERT</span>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold text-red-600">{data?.risk_level || "High"}</p>
              <p className="text-red-600 text-xs mt-1">Critical overlap detected</p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <span className="text-blue-600">⇄</span> Side-by-Side Comparison
            </h2>
            <div className="text-[10px] text-gray-400 flex gap-4 uppercase tracking-tight">
              <span>Student Submission • PDF • 4.2 MB</span>
              <span>Lecturer Marking Guide • DOCX • 1.8 MB</span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Student Submission */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h3 className="font-semibold mb-4 text-xs sm:text-sm text-gray-800 uppercase tracking-wide">Group A Submission (Student)</h3>
              <div className="space-y-6 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                <div>
                  <p className="font-bold text-gray-900 mb-1">I. Introduction</p>
                  <p className="bg-yellow-100 px-2 py-1 rounded">
                    The methodology applied in this research focuses on the <span className="font-medium">neural network architecture designed specifically for sentiment analysis</span> in decentralized social media environments.
                  </p>
                </div>
                <div className="bg-pink-50 border-l-4 border-pink-300 pl-4 py-3">
                  We utilized a Long Short-Term Memory (LSTM) network to process sequential data...
                </div>
                <div>
                  <p className="bg-yellow-100 px-2 py-1 rounded inline-block">
                    The ethical implications of AI-driven moderation were also considered as a secondary focus of this study.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Lecturer Marking Guide */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6">
              <h3 className="font-semibold mb-4 text-xs sm:text-sm text-gray-800 uppercase tracking-wide">Lecturer Marking Guide (Reference)</h3>
              <div className="space-y-6 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                <div>
                  <p className="font-bold text-gray-900 mb-1">Abstract & Overview</p>
                  <p className="bg-yellow-100 px-2 py-1 rounded">
                    Our project investigates the <span className="font-medium">neural network architecture designed specifically for sentiment analysis</span> within blockchain-based communication platforms.
                  </p>
                </div>
                <div className="bg-pink-50 border-l-4 border-pink-300 pl-4 py-3">
                  By employing a Long Short-Term Memory (LSTM) network, the system processes sequential text data while maintaining contextual word relationships...
                </div>
                <div>
                  <p className="bg-yellow-100 px-2 py-1 rounded inline-block">
                    Additionally, the ethical implications of AI-driven moderation remains a core component of our discussion section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Identified Overlaps + AI Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Identified Overlaps */}
          <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 overflow-x-auto">
            <h3 className="font-semibold mb-5 text-sm uppercase tracking-wide">Identified Overlaps</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium uppercase tracking-tighter">SECTION NAME</th>
                  <th className="pb-3 font-medium uppercase tracking-tighter">SIMILARITY</th>
                  <th className="pb-3 font-medium uppercase tracking-tighter">STATUS</th>
                  <th className="pb-3 font-medium text-right uppercase tracking-tighter">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4">Methodology - LSTM</td>
                  <td className="py-4 font-semibold text-red-600">94%</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">OVERLAP</span>
                  </td>
                  <td className="py-4 text-right text-blue-600 hover:underline cursor-pointer">View</td>
                </tr>
                <tr>
                  <td className="py-4">Ethical Framework</td>
                  <td className="py-4 font-semibold text-orange-600">82%</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full">HIGH MATCH</span>
                  </td>
                  <td className="py-4 text-right text-blue-600 hover:underline cursor-pointer">View</td>
                </tr>
                <tr>
                  <td className="py-4">Introduction & Context</td>
                  <td className="py-4 font-semibold text-amber-600">45%</td>
                  <td className="py-4">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-full">MINOR</span>
                  </td>
                  <td className="py-4 text-right text-blue-600 hover:underline cursor-pointer">View</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Assessment */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-3xl p-6">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide">AI Assessment</h3>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <i className="fa-solid fa-flag text-xs"></i>
                <span className="font-bold text-xs uppercase">Action Required</span>
              </div>
              <p className="text-[11px] font-bold text-gray-700 uppercase tracking-tight">
                MANUAL REVIEW RECOMMENDED
              </p>
              <p className="text-[11px] text-gray-600 mt-4 leading-relaxed">
                Based on the structural analysis and linguistic fingerprinting, there is a high probability of
                collaborative cross-referencing between the student submission and the lecturer marking guide.
                Shared phrasing in the methodology section suggests a unified source document.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button className="w-full py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-semibold hover:bg-blue-700 transition">
                Full Intelligence Report
              </button>
              <button className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-50 transition">
                Flag for Investigation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareWithGuide;
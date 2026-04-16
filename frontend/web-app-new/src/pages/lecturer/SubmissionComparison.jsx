import { useState } from "react";
import LecturerNavbar from "./LecturerNavbar";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "";

const SubmissionComparison = () => {
    const [left, setLeft] = useState("");
    const [right, setRight] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCompare = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("auth_token");
            const res = await axios.post(
                `${API_BASE}/api/ai-analysis/compare`,
                { file1: left, file2: right },
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );

            if (res.data.success) {
                setResult(res.data.data);
            }

        } catch (err) {
            console.error(err);
            alert("Comparison failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#f6f8fb] min-h-screen">
            <LecturerNavbar />

            <div className="p-8 max-w-7xl mx-auto">

                {/* HEADER */}
                <h1 className="text-2xl font-bold mb-6">
                    Submission Comparison Tool
                </h1>

                {/* SELECTORS */}
                <div className="grid grid-cols-3 gap-4 mb-6">

                    <input
                        placeholder="Left Submission Path"
                        value={left}
                        onChange={(e) => setLeft(e.target.value)}
                        className="border p-3 rounded-xl col-span-1"
                    />

                    <button
                        onClick={handleCompare}
                        className="bg-blue-600 text-white rounded-xl"
                    >
                        {loading ? "Running..." : "RUN ANALYSIS"}
                    </button>

                    <input
                        placeholder="Right Submission Path"
                        value={right}
                        onChange={(e) => setRight(e.target.value)}
                        className="border p-3 rounded-xl col-span-1"
                    />

                </div>

                {/* RESULT */}
                {result && (
                    <div>

                        {/* SCORE */}
                        <div className="flex justify-center mb-8">
                            <div className="w-40 h-40 rounded-full border-8 border-red-500 flex items-center justify-center text-2xl font-bold">
                                {result.similarity || 0}%
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="grid grid-cols-3 gap-6">

                            {/* LEFT DOC */}
                            <div className="bg-white p-4 rounded-2xl shadow h-[500px] overflow-auto">
                                <h3 className="font-semibold mb-2">Left Submission</h3>
                                <pre className="text-sm whitespace-pre-wrap">
                                    {result.left_text || "No data"}
                                </pre>
                            </div>

                            {/* MATCHES */}
                            <div className="bg-white p-4 rounded-2xl shadow h-[500px] overflow-auto">
                                <h3 className="font-semibold mb-2">Matched Phrases</h3>

                                {result.matches?.map((m, i) => (
                                    <div
                                        key={i}
                                        className="border-l-4 border-red-400 bg-red-50 p-2 mb-2 text-sm"
                                    >
                                        {m}
                                    </div>
                                ))}
                            </div>

                            {/* RIGHT DOC */}
                            <div className="bg-white p-4 rounded-2xl shadow h-[500px] overflow-auto">
                                <h3 className="font-semibold mb-2">Right Submission</h3>
                                <pre className="text-sm whitespace-pre-wrap">
                                    {result.right_text || "No data"}
                                </pre>
                            </div>

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

export default SubmissionComparison;
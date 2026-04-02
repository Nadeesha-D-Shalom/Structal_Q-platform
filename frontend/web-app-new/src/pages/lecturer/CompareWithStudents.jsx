import LecturerNavbar from "./LecturerNavbar";
import "@fortawesome/fontawesome-free/css/all.min.css";

const MLAnalysisResult = () => {
  return (
    <div className="bg-[#f6f8fb] min-h-screen">
      <LecturerNavbar />

      <div className="p-8 max-w-7xl mx-auto">
        {/* BREADCRUMB */}
        <p className="text-[11px] text-gray-400 mb-2">
          Home &gt; Analysis Reports &gt; Detailed ML Intelligence Report
        </p>

        {/* TITLE */}
        <h1 className="text-[22px] font-bold text-[#1c2b3a]">
          Submission Comparison Tool
        </h1>
        <p className="text-[12px] text-gray-400 mt-1 mb-8">
          Deep ML analysis for overlap detection between academic papers.
        </p>

        {/* TOP BAR - Document Selection */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-6 mb-8 shadow-sm">
          {/* Left Submission */}
          <div className="flex-1">
            <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Left Submission</p>
            <div className="h-11 bg-[#f4f6f9] border border-gray-200 rounded-xl flex items-center px-4 text-sm text-gray-700">
              Group 1.docx
              <i className="fa-solid fa-chevron-down text-gray-400 ml-auto"></i>
            </div>
          </div>

          {/* RUN ANALYSIS BUTTON */}
          <button className="px-10 py-3 bg-blue-600 hover:bg-blue-700 transition-all text-white rounded-2xl font-semibold flex items-center gap-2 shadow-md">
            <i className="fa-solid fa-bolt"></i>
            RUN ANALYSIS
          </button>

          {/* Right Submission */}
          <div className="flex-1">
            <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Right Submission</p>
            <div className="h-11 bg-[#f4f6f9] border border-gray-200 rounded-xl flex items-center px-4 text-sm text-gray-700">
              Group2FinalReport.docx
              <i className="fa-solid fa-chevron-down text-gray-400 ml-auto"></i>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-12 gap-6">

          {/* LEFT: TARGET DOCUMENT */}
          <div className="col-span-4 bg-white border border-gray-200 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="uppercase text-xs tracking-widest text-gray-400 font-medium">TARGET DOCUMENT</p>
              <p className="text-xs text-gray-400">Page 1 of 12</p>
            </div>

            <div className="text-[13px] text-gray-700 leading-relaxed space-y-4">
              <p>
                Artificial Intelligence has revolutionized how we perceive computation in the 21st century. At its core, 
                <span className="bg-red-100 px-1.5 py-0.5 rounded font-medium">machine learning models rely heavily on large datasets</span> 
                to identify patterns that are otherwise invisible to the human eye.
              </p>

              <p>
                The methodology used in this research focuses on supervised learning techniques. Specifically, 
                <span className="bg-orange-100 px-1.5 py-0.5 rounded font-medium">we implemented a neural network architecture with three hidden layers</span> 
                to process the incoming signal data from the IoT sensors.
              </p>

              <p>
                Historical data suggests that such models often suffer from overfitting if the validation set is not sufficiently diverse. 
                To combat this, 
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-medium">cross-validation was performed over ten distinct folds</span> 
                during the initial training phase.
              </p>

              <p className="text-gray-500">Finally, we conclude that the...</p>
            </div>
          </div>

          {/* CENTER: ANALYSIS RESULTS */}
          <div className="col-span-4 flex flex-col gap-6">

            {/* Similarity Score Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center">
              <p className="uppercase text-xs tracking-widest text-gray-400 mb-4">ANALYSIS RESULTS</p>
              
              <div className="relative w-40 h-40 mx-auto">
                <div className="w-40 h-40 rounded-full border-[14px] border-red-500 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-800">75%</div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-red-600 font-semibold text-sm tracking-wide">HIGH SIMILARITY</p>
              <p className="text-gray-500 text-[13px] mt-2">
                A high degree of overlap detected with existing submission RB-2023-CS
              </p>
            </div>

            {/* Matched Phrases */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 flex-1">
              <p className="font-semibold mb-4 text-gray-800">Matched Phrases</p>

              <div className="space-y-4 text-sm">
                {/* High Match */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-600 text-xs font-bold tracking-widest">HIGH MATCH</span>
                    <span className="text-[10px] text-gray-400">32 words</span>
                  </div>
                  <p className="text-gray-700">"machine learning models rely heavily on large datasets to identify patterns..."</p>
                </div>

                {/* Medium Match */}
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-orange-600 text-xs font-bold tracking-widest">MEDIUM MATCH</span>
                    <span className="text-[10px] text-gray-400">18 words</span>
                  </div>
                  <p className="text-gray-700">"implemented a neural network architecture with three hidden layers..."</p>
                </div>

                {/* Low Match */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-emerald-600 text-xs font-bold tracking-widest">LOW MATCH</span>
                    <span className="text-[10px] text-gray-400">12 words</span>
                  </div>
                  <p className="text-gray-700">"cross-validation was performed over ten distinct folds..."</p>
                </div>
              </div>

              <button className="mt-6 w-full py-3 border border-gray-300 hover:bg-gray-50 rounded-2xl text-sm font-medium transition">
                EXPORT FULL REPORT
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold text-gray-800">450</p>
                <p className="text-xs text-gray-500 mt-1">MATCHED WORDS</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-center">
                <p className="text-4xl font-bold text-gray-800">12</p>
                <p className="text-xs text-gray-500 mt-1">TOTAL SOURCES</p>
              </div>
            </div>
          </div>

          {/* RIGHT: SOURCE REFERENCE */}
          <div className="col-span-4 bg-white border border-gray-200 rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="uppercase text-xs tracking-widest text-gray-400 font-medium">SOURCE REFERENCE</p>
              <p className="text-xs text-gray-400">RB-2023-CS.pdf</p>
            </div>

            <div className="text-[13px] text-gray-700 leading-relaxed space-y-4">
              <p>
                In previous literature, it has been noted that 
                <span className="bg-red-100 px-1.5 py-0.5 rounded font-medium">machine learning models rely heavily on large datasets</span> 
                for the extraction of latent feature maps from raw data.
              </p>

              <p>
                For our experimentation phase, we 
                <span className="bg-orange-100 px-1.5 py-0.5 rounded font-medium">implemented a neural network architecture with three hidden layers</span>. 
                This specific configuration allowed for optimal weight distribution across the parameters.
              </p>

              <p>
                Following the standard protocol, 
                <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-medium">cross-validation was performed over ten distinct folds</span>. 
                This ensured the robustness of our metrics across different data splits.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Legend */}
        <div className="mt-8 flex items-center gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Similarity (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Medium Similarity (40-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span>Low/Unique (&lt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLAnalysisResult;
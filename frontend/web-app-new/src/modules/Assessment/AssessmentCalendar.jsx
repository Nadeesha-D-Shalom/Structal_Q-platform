import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useState } from "react";

const AssessmentCalendar = ({ assessments }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get items for each tile
  const tileContent = ({ date }) => {
    const items = assessments.filter(
      (a) =>
        new Date(a.due_date).toDateString() === date.toDateString()
    );

    if (items.length === 0) return null;

    return (
      <div className="flex flex-col items-center mt-1">
        {items.slice(0, 2).map((a) => (
          <div
            key={a.assessment_id}
            className={`w-1.5 h-1.5 rounded-full ${
              a.status === "overdue"
                ? "bg-red-500"
                : "bg-green-500"
            }`}
          />
        ))}
      </div>
    );
  };

  // Selected day items
  const selectedItems = assessments.filter(
    (a) =>
      new Date(a.due_date).toDateString() ===
      selectedDate.toDateString()
  );

  return (
    <div className="bg-white p-5 rounded-2xl shadow border w-full">

      {/* HEADER */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          📅 Assessment Calendar
        </h2>
        <p className="text-xs text-gray-400">
          Track upcoming and overdue assessments
        </p>
      </div>

      {/* CALENDAR */}
      <div className="mb-5">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileContent={tileContent}
          className="w-full border-none"
        />
      </div>

      {/* SELECTED DATE */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          📌 {selectedDate.toDateString()}
        </h3>

        {selectedItems.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No assessments on this day
          </p>
        ) : (
          <div className="space-y-2">
            {selectedItems.map((a) => (
              <div
                key={a.assessment_id}
                className="flex justify-between items-center p-3 rounded-lg border hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium">
                    {a.assessment_title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {a.subject_name} • {a.assessment_type}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    a.status === "overdue"
                      ? "bg-red-100 text-red-600"
                      : "bg-green-100 text-green-600"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AssessmentCalendar;


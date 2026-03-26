import './CreateTimetable.css';

export default function CreateTimetable() {
  return (
    <section className="createExamTimetable">
      <header className="createExamTimetable__header">
        <h2>Create Exam Timetable</h2>
        <p>Schedule new examinations and manage venue allocations for the upcoming academic period.</p>
      </header>

      <div className="card">
        <form className="formGrid">
          <div className="formGrid__row">
            <label className="field">
              <span>Academic Year</span>
              <select defaultValue="2023/2024">
                <option value="2023/2024">2023 / 2024</option>
                <option value="2024/2025">2024 / 2025</option>
              </select>
            </label>

            <label className="field">
              <span>Semester</span>
              <select defaultValue="first">
                <option value="first">First Semester</option>
                <option value="second">Second Semester</option>
              </select>
            </label>

            <label className="field">
              <span>Subject / Course</span>
              <select defaultValue="CS402">
                <option value="CS402">CS402 - Advanced Algorithms</option>
              </select>
            </label>
          </div>

          <div className="formGrid__row">
            <label className="field">
              <span>Exam Date</span>
              <input type="date" />
            </label>

            <label className="field">
              <span>Start Time</span>
              <input type="time" />
            </label>

            <label className="field">
              <span>Location / Venue</span>
              <input placeholder="e.g. Grand Hall A, Room 302" />
            </label>
          </div>

          <div className="statusBar">
            <div className="statusBar__info">
              <strong>Conflict Detection System</strong>
              <span>Automatic check against student and venue schedules.</span>
            </div>
            <span className="pill pill--success">No Conflict Detected</span>
          </div>

          <div className="actions">
            <button type="button" className="btn btn--primary">
              Publish Schedule
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}


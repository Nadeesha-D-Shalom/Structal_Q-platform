import { useCallback, useEffect, useMemo, useState } from "react";
import LecturerNavbar from "./LecturerNavbar";
import { useNavigate } from "react-router-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/apiBase";
import { appToast } from "../../components/UIFeedback/appNotify";

const API_BASE = getApiBaseUrl();

const EVAL_STEPS = [
  { label: "Loading", icon: "fa-solid fa-inbox" },
  { label: "Similarity", icon: "fa-solid fa-code-compare" },
  { label: "ML Analysis", icon: "fa-solid fa-brain" },
  { label: "Risk Scoring", icon: "fa-solid fa-shield-halved" },
  { label: "Saving", icon: "fa-solid fa-floppy-disk" },
];

/* ─────────────────────────── Inline Styles ─────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  .ls-root {
    font-family: 'DM Sans', sans-serif;
    background: #f0f2f7;
    min-height: 100vh;
  }

  .ls-page { padding: 32px 36px; max-width: 1600px; margin: 0 auto; }

  /* Header */
  .ls-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 28px;
  }
  .ls-title { font-size: 26px; font-weight: 600; color: #0f172a; letter-spacing: -0.5px; line-height: 1.2; }
  .ls-subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
  .ls-subtitle-meta { color: #94a3b8; font-weight: 400; }
  .ls-btn-row { display: flex; gap: 10px; align-items: center; }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    padding: 9px 18px; border-radius: 10px;
    border: none; cursor: pointer; transition: all 0.18s ease;
    white-space: nowrap; letter-spacing: 0.1px;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost {
    background: #fff; color: #334155;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .btn-ghost:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
  .btn-primary {
    background: #3b5bdb; color: #fff;
    box-shadow: 0 2px 8px rgba(59,91,219,0.28);
  }
  .btn-primary:hover:not(:disabled) { background: #3451c7; box-shadow: 0 4px 14px rgba(59,91,219,0.35); }
  .btn-success {
    background: #12b981; color: #fff;
    box-shadow: 0 2px 8px rgba(16,185,129,0.28);
  }
  .btn-success:hover:not(:disabled) { background: #0ea571; }
  .btn-danger { background: #ef4444; color: #fff; }
  .btn-danger:hover:not(:disabled) { background: #dc2626; }

  /* Icon buttons in table */
  .icon-btn {
    width: 36px; height: 36px; border-radius: 9px;
    display: inline-flex; align-items: center; justify-content: center;
    border: none; cursor: pointer; transition: all 0.15s; font-size: 13px;
  }
  .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .icon-btn-teal   { background: #e6faf5; color: #0f9e75; }
  .icon-btn-teal:hover:not(:disabled)   { background: #ccf5ea; }
  .icon-btn-sky    { background: #e0f2fe; color: #0369a1; }
  .icon-btn-sky:hover:not(:disabled)    { background: #bae6fd; }
  .icon-btn-purple { background: #ede9fe; color: #6d28d9; }
  .icon-btn-purple:hover:not(:disabled) { background: #ddd6fe; }
  .icon-btn-blue   { background: #dbeafe; color: #1d4ed8; }
  .icon-btn-blue:hover:not(:disabled)   { background: #bfdbfe; }
  .icon-btn-gray   { background: #f1f5f9; color: #475569; }
  .icon-btn-gray:hover:not(:disabled)   { background: #e2e8f0; }
  .icon-btn-red    { background: #fee2e2; color: #dc2626; }
  .icon-btn-red:hover:not(:disabled)    { background: #fecaca; }

  /* Cards */
  .card {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e8edf4;
    overflow: hidden;
  }
  .card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 24px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .card-title { font-size: 15px; font-weight: 600; color: #0f172a; }
  .card-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

  /* Table */
  .tbl { width: 100%; border-collapse: collapse; }
  .tbl-head { background: #f8fafc; }
  .tbl-head th {
    padding: 11px 16px; font-size: 10px; letter-spacing: 0.8px;
    text-transform: uppercase; font-weight: 600; color: #94a3b8;
    text-align: left; white-space: nowrap;
  }
  .tbl-head th:last-child { text-align: right; }
  .tbl-row td { padding: 13px 16px; font-size: 13px; color: #334155; border-top: 1px solid #f1f5f9; vertical-align: middle; }
  .tbl-row:hover td { background: #fafbfd; }

  /* Badges */
  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
  }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-yellow { background: #fef9c3; color: #854d0e; }
  .badge-red { background: #fee2e2; color: #b91c1c; }
  .badge-gray { background: #f1f5f9; color: #64748b; }
  .badge-blue { background: #dbeafe; color: #1e40af; }
  .badge-purple { background: #ede9fe; color: #5b21b6; }
  .badge-teal { background: #ccfbf1; color: #0f766e; }
  .badge-dot::before {
    content: ''; display: block;
    width: 6px; height: 6px; border-radius: 50%; background: currentColor;
  }

  /* Avatar circle */
  .avatar {
    width: 36px; height: 36px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
    font-family: 'Space Mono', monospace;
  }
  .avatar-1 { background: #dbeafe; color: #1e40af; }
  .avatar-2 { background: #ede9fe; color: #5b21b6; }
  .avatar-3 { background: #dcfce7; color: #15803d; }
  .avatar-4 { background: #fef3c7; color: #92400e; }
  .avatar-5 { background: #fce7f3; color: #9d174d; }

  /* Step progress */
  .step-wrap {
    background: #fff; border-radius: 14px; border: 1px solid #e8edf4;
    padding: 20px 28px; margin-bottom: 24px;
    animation: slideDown 0.3s ease;
  }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  .step-track { display: flex; align-items: center; gap: 0; }
  .step-node { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 0 0 auto; }
  .step-circle {
    width: 40px; height: 40px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; transition: all 0.3s ease; position: relative;
  }
  .step-circle.done { background: #12b981; color: #fff; }
  .step-circle.active { background: #eff6ff; color: #3b5bdb; border: 2px solid #3b5bdb; }
  .step-circle.idle { background: #f8fafc; color: #cbd5e1; border: 2px solid #e2e8f0; }
  .step-circle.active::after {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid transparent; border-top-color: #3b5bdb;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .step-label { font-size: 11px; color: #94a3b8; font-weight: 500; }
  .step-label.active { color: #3b5bdb; }
  .step-label.done { color: #12b981; }
  .step-line { flex: 1; height: 2px; background: #f1f5f9; transition: background 0.4s; margin-bottom: 20px; }
  .step-line.done { background: #12b981; }
  .step-footer { margin-top: 14px; font-size: 12px; color: #94a3b8; }
  .step-footer.done { color: #12b981; font-weight: 500; }

  /* Stats bar */
  .stats-bar {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
  }
  .stat-card {
    background: #fff; border-radius: 14px; border: 1px solid #e8edf4;
    padding: 16px 20px;
  }
  .stat-label { font-size: 11px; color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
  .stat-value { font-size: 28px; font-weight: 600; color: #0f172a; margin-top: 4px; font-family: 'Space Mono', monospace; line-height: 1; }
  .stat-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

  /* Manual mark input */
  .mark-input {
    width: 72px; padding: 5px 9px; border-radius: 7px;
    border: 1.5px solid #e2e8f0; font-size: 13px; font-family: 'Space Mono', monospace;
    color: #0f172a; background: #f8fafc; outline: none; transition: border 0.15s;
  }
  .mark-input:focus { border-color: #3b5bdb; background: #fff; }
  .mark-input:disabled { opacity: 0.6; }

  /* File link */
  .file-link {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; font-weight: 600; color: #3b5bdb; text-decoration: none;
    padding: 4px 8px; border-radius: 6px; background: #eff6ff;
    transition: background 0.15s;
  }
  .file-link:hover { background: #dbeafe; }

  /* Score button */
  .score-btn {
    background: none; border: none; cursor: pointer; padding: 0;
    font-family: 'Space Mono', monospace; font-size: 15px; font-weight: 700;
    color: #3b5bdb; text-decoration: underline; text-decoration-style: dotted;
    text-underline-offset: 3px;
  }
  .score-btn:hover { color: #1e3a8a; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.5);
    backdrop-filter: blur(6px); z-index: 200;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .modal-box {
    background: #fff; border-radius: 20px; max-width: 520px; width: 100%;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 24px 60px rgba(0,0,0,0.18);
    animation: popUp 0.25s cubic-bezier(0.34,1.3,0.64,1);
  }
  @keyframes popUp { from { opacity: 0; transform: scale(0.93) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-head { padding: 24px 24px 0; }
  .modal-title { font-size: 17px; font-weight: 600; color: #0f172a; }
  .modal-desc { font-size: 13px; color: #64748b; margin-top: 5px; line-height: 1.5; }
  .modal-body { padding: 20px 24px; }
  .modal-foot { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }

  /* Form elements inside modal */
  .field-label { font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 6px; display: block; }
  .field-select {
    width: 100%; padding: 9px 12px; border-radius: 9px; border: 1.5px solid #e2e8f0;
    font-size: 13px; font-family: 'DM Sans', sans-serif; color: #0f172a;
    background: #f8fafc; outline: none; transition: border 0.15s; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center;
    padding-right: 32px;
  }
  .field-select:focus { border-color: #3b5bdb; background-color: #fff; }
  .field-select:disabled { opacity: 0.5; }
  .field-gap { margin-bottom: 16px; }
  .submission-list { border: 1.5px solid #e8edf4; border-radius: 10px; max-height: 160px; overflow-y: auto; }
  .submission-list-empty { padding: 14px 16px; font-size: 13px; color: #94a3b8; }
  .submission-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    font-size: 13px; cursor: pointer; transition: background 0.12s;
    border-bottom: 1px solid #f1f5f9;
  }
  .submission-item:last-child { border-bottom: none; }
  .submission-item:hover { background: #f8fafc; }
  .submission-item input[type=checkbox] { accent-color: #3b5bdb; width: 15px; height: 15px; }
  .sel-controls { display: flex; gap: 12px; margin-bottom: 8px; }
  .sel-link { font-size: 12px; color: #3b5bdb; cursor: pointer; background: none; border: none; padding: 0; font-family: 'DM Sans', sans-serif; }
  .sel-link:hover { text-decoration: underline; }

  /* Success popup */
  .popup-overlay {
    position: fixed; inset: 0; background: rgba(15,23,42,0.55);
    backdrop-filter: blur(8px); z-index: 300;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .popup-box {
    background: #fff; border-radius: 24px; max-width: 400px; width: 100%;
    padding: 36px 32px; text-align: center;
    box-shadow: 0 32px 80px rgba(0,0,0,0.2);
    animation: popUp 0.35s cubic-bezier(0.34,1.3,0.64,1);
  }
  .popup-icon-wrap {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #12b981, #059669);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 28px; color: #fff;
    box-shadow: 0 8px 24px rgba(16,185,129,0.35);
  }
  .popup-title { font-size: 20px; font-weight: 600; color: #0f172a; margin: 0 0 8px; }
  .popup-msg { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 20px; }
  .popup-details { background: #f8fafc; border-radius: 12px; padding: 14px 18px; margin-bottom: 22px; text-align: left; }
  .popup-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
  .popup-row:last-child { border-bottom: none; }
  .popup-key { color: #64748b; }
  .popup-val { font-weight: 600; color: #0f172a; font-family: 'Space Mono', monospace; font-size: 12px; }

  /* Empty state */
  .empty-state { padding: 48px 24px; text-align: center; color: #94a3b8; }
  .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.5; }
  .empty-text { font-size: 14px; }

  /* Loading skeleton shimmer */
  .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200%; animation: shimmer 1.4s infinite; border-radius: 6px; }
  @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

  /* Monospace numbers */
  .mono { font-family: 'Space Mono', monospace; font-size: 13px; }

  /* Spinner inline */
  .spin-inline {
    display: inline-block; width: 13px; height: 13px;
    border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }

  /* Tooltip-style title enhancements handled by native title */

  /* Divider */
  .section-gap { margin-bottom: 24px; }

  /* Responsive action row */
  .action-row { display: flex; gap: 6px; justify-content: flex-end; align-items: center; }
`;

/* ─────────────────────────── Helpers ─────────────────────────── */
const avatarClass = (i) => ["avatar-1","avatar-2","avatar-3","avatar-4","avatar-5"][i % 5];

const getSimilarity = (val) => {
  if (!val) return { text: "0% Low", cls: "badge-green" };
  const pct = Math.round(val * 100);
  if (pct < 30) return { text: `${pct}% Low`, cls: "badge-green" };
  if (pct < 70) return { text: `${pct}% Medium`, cls: "badge-yellow" };
  return { text: `${pct}% High`, cls: "badge-red" };
};

const getRisk = (score) => {
  if (!score) return { text: "PASSED", cls: "badge-green" };
  if (score > 0.8) return { text: "CRITICAL", cls: "badge-red" };
  if (score > 0.5) return { text: "REVIEW", cls: "badge-yellow" };
  return { text: "PASSED", cls: "badge-green" };
};

/* ─────────────────────────── SuccessPopup ─────────────────────────── */
const SuccessPopup = ({ isVisible, onClose, message, title, details }) => {
  useEffect(() => {
    if (!isVisible) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [isVisible, onClose]);

  if (!isVisible) return null;
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box" onClick={e => e.stopPropagation()}>
        <div className="popup-icon-wrap">
          <i className="fa-solid fa-check" />
        </div>
        <h2 className="popup-title">{title || "Success!"}</h2>
        <p className="popup-msg">{message}</p>
        {details && Object.keys(details).length > 0 && (
          <div className="popup-details">
            {Object.entries(details).map(([k,v]) => (
              <div key={k} className="popup-row">
                <span className="popup-key">{k}</span>
                <span className="popup-val">{v}</span>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary" onClick={onClose} style={{ width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 14 }}>
          Continue
        </button>
      </div>
    </div>
  );
};

/* ─────────────────────────── StepProgress ─────────────────────────── */
const StepProgress = ({ currentStep }) => {
  const allDone = currentStep === EVAL_STEPS.length;
  return (
    <div className="step-wrap">
      <div className="step-track">
        {EVAL_STEPS.map((s, i) => {
          const done = currentStep > i;
          const active = currentStep === i;
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", flex: i < EVAL_STEPS.length - 1 ? "1" : "0 0 auto" }}>
              <div className="step-node">
                <div className={`step-circle ${done ? "done" : active ? "active" : "idle"}`}>
                  {done
                    ? <i className="fa-solid fa-check" style={{ fontSize: 13 }} />
                    : <i className={s.icon} style={{ fontSize: 13 }} />}
                </div>
                <span className={`step-label ${done ? "done" : active ? "active" : ""}`}>{s.label}</span>
              </div>
              {i < EVAL_STEPS.length - 1 && (
                <div className={`step-line ${done ? "done" : ""}`} style={{ marginTop: 19 }} />
              )}
            </div>
          );
        })}
      </div>
      <p className={`step-footer ${allDone ? "done" : ""}`}>
        {allDone
          ? `✓ All ${EVAL_STEPS.length} steps complete — results ready`
          : currentStep >= 0
            ? `Step ${currentStep + 1} / ${EVAL_STEPS.length}: ${EVAL_STEPS[currentStep].label}…`
            : ""}
      </p>
    </div>
  );
};

/* ─────────────────────────── BatchModal ─────────────────────────── */
const BatchModal = ({
  onClose, onStart,
  subjectOptions, batchSubjectId, setBatchSubjectId,
  assessmentOptions, batchAssessmentId, setBatchAssessmentId,
  guidesForAssessment, batchMarkingGuideId, setBatchMarkingGuideId,
  submissionRows, batchSelectedSubmissionIds, setBatchSelectedSubmissionIds,
}) => {
  const toggle = (sid) => {
    const n = Number(sid);
    setBatchSelectedSubmissionIds(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    );
  };
  const canStart = batchAssessmentId && batchMarkingGuideId && batchSelectedSubmissionIds.length > 0;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <p className="modal-title">
            <i className="fa-solid fa-wand-magic-sparkles" style={{ color: "#3b5bdb", marginRight: 8 }} />
            Batch AI Evaluation
          </p>
          <p className="modal-desc">Select subject, assignment and marking guide. The same guide applies to every chosen submission.</p>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="field-gap">
            <label className="field-label">Subject</label>
            <select className="field-select" value={batchSubjectId} onChange={e => setBatchSubjectId(e.target.value)}>
              <option value="">All subjects</option>
              {subjectOptions.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </select>
          </div>
          <div className="field-gap">
            <label className="field-label">Assignment</label>
            <select className="field-select" value={batchAssessmentId} onChange={e => setBatchAssessmentId(e.target.value)}>
              {assessmentOptions.length === 0
                ? <option value="">No assessments in filter</option>
                : assessmentOptions.map(a => <option key={a.id} value={String(a.id)}>{a.title}</option>)}
            </select>
          </div>
          <div className="field-gap">
            <label className="field-label">Marking guide <span style={{ color: "#ef4444" }}>*</span></label>
            <select
              className="field-select"
              value={batchMarkingGuideId}
              onChange={e => setBatchMarkingGuideId(e.target.value)}
              disabled={!batchAssessmentId || guidesForAssessment.length === 0}
            >
              {!batchAssessmentId || guidesForAssessment.length === 0
                ? <option value="">{batchAssessmentId ? "No guide — upload one under Marking Guide" : "Select an assignment first"}</option>
                : guidesForAssessment.map(g => {
                    const gid = g.marking_guide_id ?? g.guide_id;
                    return <option key={gid} value={String(gid)}>{g.title || g.guide_name || `Guide #${gid}`}</option>;
                  })}
            </select>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label className="field-label" style={{ margin: 0 }}>Submissions to evaluate</label>
              <div className="sel-controls">
                <button className="sel-link" onClick={() => setBatchSelectedSubmissionIds(submissionRows.map(r => Number(r.submission_id)))}>Select all</button>
                <button className="sel-link" style={{ color: "#94a3b8" }} onClick={() => setBatchSelectedSubmissionIds([])}>Clear</button>
              </div>
            </div>
            <div className="submission-list">
              {submissionRows.length === 0
                ? <div className="submission-list-empty">No submissions for this assignment</div>
                : submissionRows.map(r => {
                    const sid = Number(r.submission_id);
                    const checked = batchSelectedSubmissionIds.includes(sid);
                    return (
                      <label key={sid} className="submission-item">
                        <input type="checkbox" checked={checked} onChange={() => toggle(sid)} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          <span style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#94a3b8", marginRight: 6 }}>#{sid}</span>
                          {r.original_file_name || "file"}
                        </span>
                      </label>
                    );
                  })}
            </div>
            {batchSelectedSubmissionIds.length > 0 && (
              <p style={{ fontSize: 12, color: "#3b5bdb", marginTop: 6 }}>
                {batchSelectedSubmissionIds.length} submission{batchSelectedSubmissionIds.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canStart} onClick={onStart}>
            <i className="fa-solid fa-play" style={{ fontSize: 11 }} />
            Start evaluation
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────── Main Component ─────────────────────────── */
const LecturerSubmissions = () => {
  const navigate = useNavigate();
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatedResults, setEvaluatedResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [fileActionKey, setFileActionKey] = useState("");
  const [currentStep, setCurrentStep] = useState(-1);
  const [manualMarks, setManualMarks] = useState({});
  const [finalMarks, setFinalMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDetails, setPopupDetails] = useState({});
  const [savedResults, setSavedResults] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [allMarkingGuides, setAllMarkingGuides] = useState([]);
  const [batchSubjectId, setBatchSubjectId] = useState("");
  const [batchAssessmentId, setBatchAssessmentId] = useState("");
  const [batchMarkingGuideId, setBatchMarkingGuideId] = useState("");
  const [batchSelectedSubmissionIds, setBatchSelectedSubmissionIds] = useState([]);
  const [catalogSubjects, setCatalogSubjects] = useState([]);
  const [lastAutoRefresh, setLastAutoRefresh] = useState(null);

  /* ── data fetching ── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/subjects`, { headers: getAuthHeaders() });
        const json = await res.json();
        setCatalogSubjects(Array.isArray(json) ? json : json?.data ?? []);
      } catch { setCatalogSubjects([]); }
    })();
  }, [getAuthHeaders]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/marking-guides`, { headers: getAuthHeaders() });
        const json = await res.json();
        const list = json?.success && Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : json?.data && Array.isArray(json.data) ? json.data : [];
        if (!cancelled) setAllMarkingGuides(list);
      } catch { if (!cancelled) setAllMarkingGuides([]); }
    })();
    return () => { cancelled = true; };
  }, [getAuthHeaders]);

  const subjectOptions = useMemo(() => {
    const m = new Map();
    const add = (id, name) => { if (id == null || id === "") return; const k = String(id); if (!m.has(k)) m.set(k, { id, name }); };
    data.forEach(r => add(r.subject_id, r.subject_name || r.subject_code || `Subject ${r.subject_id}`));
    catalogSubjects.forEach(s => add(s.subject_id, s.subject_name || s.subject_code || `Subject ${s.subject_id}`));
    allMarkingGuides.forEach(g => add(g.subject_id, g.subject_name || `Subject ${g.subject_id}`));
    const list = [...m.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const hasMissing = data.some(r => r.subject_id == null);
    return hasMissing ? [{ id: "__uncat__", name: "No subject linked" }, ...list] : list;
  }, [data, catalogSubjects, allMarkingGuides]);

  const rowsForSubject = useMemo(() => {
    if (!batchSubjectId) return data;
    if (batchSubjectId === "__uncat__") return data.filter(r => r.subject_id == null);
    return data.filter(r => String(r.subject_id) === String(batchSubjectId));
  }, [data, batchSubjectId]);

  const assessmentOptions = useMemo(() => {
    const m = new Map();
    const addAss = (id, title) => { if (id == null || id === "") return; const k = String(id); if (!m.has(k)) m.set(k, { id, title: title || `Assignment ${id}` }); };
    rowsForSubject.forEach(r => addAss(r.assessment_id, r.assessment_title));
    if (m.size === 0 && batchSubjectId && batchSubjectId !== "__uncat__") allMarkingGuides.forEach(g => { if (String(g.subject_id) !== String(batchSubjectId)) return; addAss(g.assessment_id, g.assessment_title); });
    if (m.size === 0) data.forEach(r => addAss(r.assessment_id, r.assessment_title));
    if (m.size === 0) allMarkingGuides.forEach(g => addAss(g.assessment_id, g.assessment_title));
    return [...m.values()].sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }, [rowsForSubject, batchSubjectId, allMarkingGuides, data]);

  const submissionRows = useMemo(() => {
    if (!batchAssessmentId) return [];
    const pool = rowsForSubject.length > 0 ? rowsForSubject : data;
    return pool.filter(r => String(r.assessment_id) === String(batchAssessmentId));
  }, [rowsForSubject, batchAssessmentId, data]);

  const guidesForAssessment = useMemo(() => {
    if (!batchAssessmentId) return [];
    return allMarkingGuides.filter(g => g.assessment_id != null && String(g.assessment_id) === String(batchAssessmentId));
  }, [allMarkingGuides, batchAssessmentId]);

  useEffect(() => {
    if (!showBatchModal) return;
    setBatchSelectedSubmissionIds(submissionRows.map(r => Number(r.submission_id)));
  }, [showBatchModal, batchSubjectId, batchAssessmentId, submissionRows]);

  useEffect(() => {
    if (!showBatchModal) return;
    if (assessmentOptions.length === 0) { if (batchAssessmentId) setBatchAssessmentId(""); return; }
    if (!assessmentOptions.some(o => String(o.id) === String(batchAssessmentId))) setBatchAssessmentId(String(assessmentOptions[0].id));
  }, [showBatchModal, assessmentOptions, batchAssessmentId]);

  useEffect(() => {
    if (!showBatchModal || !batchAssessmentId) return;
    const gid = x => x.marking_guide_id ?? x.guide_id;
    if (guidesForAssessment.length && !guidesForAssessment.some(x => String(gid(x)) === String(batchMarkingGuideId))) setBatchMarkingGuideId(String(gid(guidesForAssessment[0])));
    if (!guidesForAssessment.length) setBatchMarkingGuideId("");
  }, [showBatchModal, batchAssessmentId, guidesForAssessment, batchMarkingGuideId]);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/submissions/lecturer/all`, { headers: getAuthHeaders() });
      const result = await res.json();
      setData(Array.isArray(result) ? result : result.success && Array.isArray(result.data) ? result.data : []);
    } catch { setData([]); } finally { setLoading(false); }
  }, [getAuthHeaders]);

  const fetchEvaluatedResults = useCallback(async (opts = {}) => {
    const silent = opts.silent === true;
    try {
      if (!silent) setResultsLoading(true);
      const res = await axios.get(`${API_BASE}/api/ai-analysis/results/all`, { headers: getAuthHeaders() });
      const rows = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : null;
      if (rows) {
        setEvaluatedResults(rows);
        const im = {}; const fi = {};
        rows.forEach(r => {
          const rid = r.analysis_result_id ?? r.Analysis_Result_Id;
          if (rid == null) return;
          im[rid] = "";
          fi[rid] = Number(r.final_score ?? r.Final_Score ?? 0) || 0;
        });
        setManualMarks(im); setFinalMarks(fi);
      } else { setEvaluatedResults([]); }
    } catch { setEvaluatedResults([]); } finally { if (!silent) setResultsLoading(false); }
  }, [getAuthHeaders]);

  useEffect(() => { fetchSubmissions(); fetchEvaluatedResults(); }, [fetchSubmissions, fetchEvaluatedResults]);

  useEffect(() => {
    const intervalMs = 45_000;
    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      Promise.all([fetchSubmissions(), fetchEvaluatedResults({ silent: true })]).then(() => {
        setLastAutoRefresh(new Date());
      });
    };
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [fetchSubmissions, fetchEvaluatedResults]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const total = data.length;
    const highRisk = data.filter(r => (r.risk_score || 0) > 0.8).length;
    const evaluated = evaluatedResults.length;
    const avgScore = evaluatedResults.length
      ? (evaluatedResults.reduce((s, r) => s + Number(r.final_score ?? r.Final_Score ?? 0), 0) / evaluatedResults.length).toFixed(1)
      : "–";
    return { total, highRisk, evaluated, avgScore };
  }, [data, evaluatedResults]);

  /* ── handlers ── */
  const handleManualMarkChange = (arId, aiScore, maxMark = 100) => (e) => {
    const v = e.target.value;
    if (v === "") { setManualMarks(p => ({ ...p, [arId]: "" })); setFinalMarks(p => ({ ...p, [arId]: aiScore || 0 })); return; }
    let n = parseFloat(v);
    if (isNaN(n)) return;
    n = Math.min(maxMark, Math.max(0, Math.round(n * 100) / 100));
    setManualMarks(p => ({ ...p, [arId]: n }));
    const final = Math.round(Math.min(100, Math.max(0, ((aiScore || 0) + n) / 2)) * 100) / 100;
    setFinalMarks(p => ({ ...p, [arId]: final }));
  };

  const handleSaveAllResults = async () => {
    const toSave = evaluatedResults.map(r => {
      const arId = r.analysis_result_id ?? r.Analysis_Result_Id;
      return {
        analysis_result_id: arId,
        submission_id: r.submission_id ?? r.Submission_Id,
        ai_marks: r.final_score ?? r.Final_Score ?? 0,
        diagram_marks: manualMarks[arId] || 0,
        final_mark: finalMarks[arId] || r.final_score || r.Final_Score || 0,
      };
    }).filter(r => r.diagram_marks > 0 && r.diagram_marks !== "" && r.diagram_marks !== null);

    if (!toSave.length) { appToast("No manual marks entered. Please enter marks first.", "warning"); return; }
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE}/api/marks/evaluated-results/save`, { results: toSave });
      if (response.data.success) {
        setSavedResults(prev => [...prev, ...toSave.map(r => r.submission_id)]);
        setPopupTitle("Results Saved Successfully");
        setPopupMessage(`${response.data.saved.length} evaluated result${response.data.saved.length > 1 ? "s" : ""} have been saved.`);
        setPopupDetails({ "Total Saved": response.data.saved.length, "AI Processed": evaluatedResults.length, "Manual Entries": toSave.length, "Status": "Completed" });
        setShowSuccessPopup(true);
        await fetchEvaluatedResults();
      } else { appToast(response.data.message || "Failed to save results", "error"); }
    } catch { appToast("Failed to save evaluated results", "error"); } finally { setSaving(false); }
  };

  const openBatchEvaluateModal = () => {
    const first = data[0];
    setBatchSubjectId(first?.subject_id != null ? String(first.subject_id) : data.some(r => r.subject_id == null) ? "__uncat__" : "");
    setBatchAssessmentId(first?.assessment_id != null ? String(first.assessment_id) : "");
    setBatchMarkingGuideId("");
    setShowBatchModal(true);
  };

  const runBatchEvaluation = async () => {
    if (!batchAssessmentId || !batchMarkingGuideId) { appToast("Please select an assessment and a marking guide.", "warning"); return; }
    if (!batchSelectedSubmissionIds.length) { appToast("Select at least one submission.", "warning"); return; }
    setShowBatchModal(false);
    try {
      setIsEvaluating(true); setCurrentStep(0);
      const iv = setInterval(() => {
        setCurrentStep(p => { if (p < EVAL_STEPS.length - 1) return p + 1; clearInterval(iv); return p; });
      }, 900);
      const res = await fetch(`${API_BASE}/api/ai-analysis/evaluate-all/${batchAssessmentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ marking_guide_id: Number(batchMarkingGuideId), submission_ids: batchSelectedSubmissionIds }),
      });
      const result = await res.json();
      if (!res.ok) { clearInterval(iv); throw new Error(result.error || result.message || "Evaluation failed"); }
      clearInterval(iv); setCurrentStep(EVAL_STEPS.length);
      setTimeout(() => { fetchSubmissions(); fetchEvaluatedResults(); setTimeout(() => setCurrentStep(-1), 2000); }, 1000);
    } catch (err) { appToast(err.message, "error"); setCurrentStep(-1); } finally { setIsEvaluating(false); }
  };

  const handleView = (id) => navigate(`/lecturer/submissions/${id}`);
  const handleAnalyze = (row) => navigate("/lecturer/ml-analysis", { state: { submission_id: row.submission_id, marking_guide_id: row.marking_guide_id || 1, submission_path: row.storage_path, guide_file: row.guide_path || "" } });
  const handleCompare = (row) => navigate(`/analysis/${row.submission_id}`, { state: { submission_id: row.submission_id, file_id: row.file_id, file_name: row.original_file_name, storage_path: row.storage_path } });

  const coerceSubmissionFileId = (row) => {
    const v = row?.file_id ?? row?.File_Id ?? row?.fileId;
    if (v == null || v === "") return NaN;
    if (typeof v === "bigint") return Number(v);
    const n = Number(String(v).trim());
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };

  const fetchSubmissionFileBlob = async (fileId, { download = false, filename = "" } = {}) => {
    const id = typeof fileId === "number" && Number.isFinite(fileId) ? fileId : Number(fileId);
    if (!id || !Number.isFinite(id) || id <= 0) throw new Error("Submission file is not available.");
    const q = download ? "?download=1" : "";
    const url = `${API_BASE}/api/submissions/file/${id}${q}`;
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(t?.trim() || `Unable to access file (${res.status})`);
    }
    const mime =
      res.headers.get("content-type")?.split(";")[0]?.trim() ||
      (String(filename).toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
    const buf = await res.arrayBuffer();
    return new Blob([buf], { type: mime });
  };

  /** Must open a tab synchronously (before any await) or the browser blocks pop-ups. */
  const previewSubmissionDocument = (row) => {
    const key = `preview-${row.submission_id}`;
    const previewWin = window.open("about:blank", "_blank");
    if (!previewWin) {
      appToast("Pop-up blocked. Allow pop-ups for this site to open the preview tab.", "warning");
      return;
    }
    previewWin.document.title = "Loading preview…";
    const loading = previewWin.document.createElement("p");
    loading.style.cssText = "font-family:system-ui,sans-serif;padding:24px;color:#64748b";
    loading.textContent = "Loading document…";
    previewWin.document.body.appendChild(loading);

    (async () => {
      try {
        setFileActionKey(key);
        const fileId = coerceSubmissionFileId(row);
        if (!Number.isFinite(fileId)) {
          previewWin.close();
          throw new Error("No file is linked to this submission.");
        }
        const blob = await fetchSubmissionFileBlob(fileId, {
          download: false,
          filename: row?.original_file_name || "",
        });
        const ext = String(row?.original_file_name || "").toLowerCase();
        const isPdf = ext.endsWith(".pdf") || (blob.type && blob.type.includes("pdf"));
        const objectUrl = window.URL.createObjectURL(blob);
        if (isPdf) {
          previewWin.location.replace(objectUrl);
        } else {
          const safeName = (row?.original_file_name || "submission").replace(/"/g, "");
          previewWin.document.open();
          previewWin.document.write(
            `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body style="font-family:system-ui,sans-serif;padding:24px">` +
              `<p>Inline preview is only available for PDF. Use the link below to open or save this file.</p>` +
              `<p><a href="${objectUrl}" download="${safeName}" style="color:#2563eb;font-weight:600">Download file</a></p>` +
              `</body></html>`
          );
          previewWin.document.close();
        }
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 600000);
      } catch (err) {
        try {
          previewWin.document.body.innerHTML = "";
          const errP = previewWin.document.createElement("p");
          errP.style.cssText = "font-family:system-ui,sans-serif;padding:24px;color:#b91c1c";
          errP.textContent = err?.message || "Preview failed";
          previewWin.document.body.appendChild(errP);
        } catch {
          previewWin.close();
        }
        appToast(err?.message || "Preview failed", "error");
      } finally {
        setFileActionKey("");
      }
    })();
  };

  const downloadSubmissionDocument = async (row) => {
    const key = `download-${row.submission_id}`;
    try {
      setFileActionKey(key);
      const fileId = coerceSubmissionFileId(row);
      if (!Number.isFinite(fileId)) throw new Error("No file is linked to this submission.");
      const blob = await fetchSubmissionFileBlob(fileId, {
        download: true,
        filename: row?.original_file_name || "",
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = row?.original_file_name || `submission-${row.submission_id}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60000);
    } catch (err) {
      appToast(err?.message || "Download failed", "error");
    } finally {
      setFileActionKey("");
    }
  };

  /* ─────────────────────────── Render ─────────────────────────── */
  return (
    <div className="ls-root">
      <style>{styles}</style>
      <LecturerNavbar activePage="Submissions" />

      <SuccessPopup
        isVisible={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        details={popupDetails}
      />

      {showBatchModal && (
        <BatchModal
          onClose={() => setShowBatchModal(false)}
          onStart={runBatchEvaluation}
          subjectOptions={subjectOptions}
          batchSubjectId={batchSubjectId} setBatchSubjectId={setBatchSubjectId}
          assessmentOptions={assessmentOptions}
          batchAssessmentId={batchAssessmentId} setBatchAssessmentId={setBatchAssessmentId}
          guidesForAssessment={guidesForAssessment}
          batchMarkingGuideId={batchMarkingGuideId} setBatchMarkingGuideId={setBatchMarkingGuideId}
          submissionRows={submissionRows}
          batchSelectedSubmissionIds={batchSelectedSubmissionIds} setBatchSelectedSubmissionIds={setBatchSelectedSubmissionIds}
        />
      )}

      <div className="ls-page">

        {/* ── HEADER ── */}
        <div className="ls-header">
          <div>
            <h1 className="ls-title">ML-Enhanced Submissions</h1>
            <p className="ls-subtitle">
              AI-powered evaluation · Similarity detection · Risk analysis
              <span className="ls-subtitle-meta">
                {" "}
                · Auto-refresh every 45s (while tab visible)
                {lastAutoRefresh ? ` · Last: ${lastAutoRefresh.toLocaleTimeString()}` : ""}
              </span>
            </p>
          </div>
          <div className="ls-btn-row">
            <button onClick={fetchEvaluatedResults} disabled={resultsLoading} className="btn btn-ghost">
              {resultsLoading ? <><span className="spin-inline" style={{ borderTopColor: "#3b5bdb", borderColor: "rgba(59,91,219,0.2)" }} />Loading…</> : <><i className="fa-solid fa-table-list" />Load Results</>}
            </button>
            <button onClick={openBatchEvaluateModal} disabled={isEvaluating || data.length === 0} className="btn btn-primary">
              {isEvaluating ? <><span className="spin-inline" />Evaluating…</> : <><i className="fa-solid fa-wand-magic-sparkles" />Evaluate All</>}
            </button>
          </div>
        </div>

        {/* ── STATS BAR ── */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Submissions</div>
            <div className="stat-value">{loading ? "–" : stats.total}</div>
            <div className="stat-sub">All groups</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Evaluated</div>
            <div className="stat-value" style={{ color: "#3b5bdb" }}>{stats.evaluated}</div>
            <div className="stat-sub">AI processed</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">High Risk</div>
            <div className="stat-value" style={{ color: stats.highRisk > 0 ? "#ef4444" : "#0f172a" }}>{loading ? "–" : stats.highRisk}</div>
            <div className="stat-sub">Needs review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Score</div>
            <div className="stat-value" style={{ color: "#12b981" }}>{stats.avgScore}</div>
            <div className="stat-sub">AI scores</div>
          </div>
        </div>

        {/* ── STEP PROGRESS ── */}
        {currentStep >= 0 && <StepProgress currentStep={currentStep} />}

        {/* ── SUBMISSIONS TABLE ── */}
        <div className="card section-gap">
          <div className="card-header">
            <div>
              <div className="card-title">
                <i className="fa-solid fa-inbox" style={{ color: "#3b5bdb", marginRight: 8, fontSize: 14 }} />
                Submissions
              </div>
              <div className="card-sub">{data.length} submission{data.length !== 1 ? "s" : ""} found</div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead className="tbl-head">
                <tr>
                  <th>Group</th>
                  <th>File</th>
                  <th>Version</th>
                  <th>Status</th>
                  <th>Similarity</th>
                  <th>ML Risk</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="tbl-row">
                      {[...Array(7)].map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 20, width: j === 6 ? 140 : "80%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><div className="empty-icon"><i className="fa-regular fa-folder-open" /></div><div className="empty-text">No submissions found</div></div></td></tr>
                ) : (
                  data.map((row, i) => {
                    const sim = getSimilarity(row.similarity_avg);
                    const risk = getRisk(row.risk_score);
                    return (
                      <tr key={row.submission_id} className="tbl-row">
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className={`avatar ${avatarClass(i)}`}>G{i + 1}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>Group {i + 1}</div>
                              <div className="mono" style={{ fontSize: 11, color: "#94a3b8" }}>#{row.submission_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <i className="fa-regular fa-file-pdf" style={{ color: "#ef4444", fontSize: 13 }} />
                            <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13 }}>{row.original_file_name}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-gray">v{row.attempt_no || 1}</span></td>
                        <td>
                          {Number(row.is_late) === 1
                            ? <span className="badge badge-yellow badge-dot">Late</span>
                            : <span className="badge badge-green badge-dot">On-Time</span>}
                        </td>
                        <td><span className={`badge ${sim.cls}`}>{sim.text}</span></td>
                        <td><span className={`badge ${risk.cls}`}>{risk.text}</span></td>
                        <td>
                          <div className="action-row">
                            <button onClick={() => previewSubmissionDocument(row)} title="Preview" disabled={fileActionKey === `preview-${row.submission_id}`} className="icon-btn icon-btn-teal"><i className="fa-regular fa-file-lines" /></button>
                            <button onClick={() => downloadSubmissionDocument(row)} title="Download" disabled={fileActionKey === `download-${row.submission_id}`} className="icon-btn icon-btn-sky"><i className="fa-solid fa-download" /></button>
                            <button onClick={() => handleView(row.submission_id)} title="Open workspace" className="icon-btn icon-btn-purple"><i className="fa-solid fa-wand-magic-sparkles" /></button>
                            <button onClick={() => handleAnalyze(row)} title="AI Analysis" className="icon-btn icon-btn-blue"><i className="fa-solid fa-code-compare" /></button>
                            <button onClick={() => handleCompare(row)} title="Compare" className="icon-btn icon-btn-gray"><i className="fa-regular fa-eye" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── EVALUATED RESULTS TABLE ── */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <i className="fa-solid fa-chart-bar" style={{ color: "#12b981", marginRight: 8, fontSize: 14 }} />
                Evaluated Results
              </div>
              <div className="card-sub">AI scores + manual marks for diagrams</div>
            </div>
            {evaluatedResults.length > 0 && !resultsLoading && (
              <button onClick={handleSaveAllResults} disabled={saving} className="btn btn-success">
                {saving ? <><span className="spin-inline" />Saving…</> : <><i className="fa-solid fa-floppy-disk" />Save All Results</>}
              </button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead className="tbl-head">
                <tr>
                  <th>Group</th>
                  <th>Student File</th>
                  <th>Guide</th>
                  <th>Assignment</th>
                  <th>AI Score</th>
                  <th>Manual Mark</th>
                  <th>Final</th>
                  <th>Risk</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {resultsLoading ? (
                  [1,2,3].map(i => (
                    <tr key={i} className="tbl-row">
                      {[...Array(9)].map((_, j) => (
                        <td key={j}><div className="skeleton" style={{ height: 18, width: "75%" }} /></td>
                      ))}
                    </tr>
                  ))
                ) : evaluatedResults.length === 0 ? (
                  <tr><td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-icon"><i className="fa-solid fa-chart-bar" /></div>
                      <div className="empty-text">No evaluated results yet — click "Load Results" to fetch</div>
                    </div>
                  </td></tr>
                ) : (
                  evaluatedResults.map((row, i) => {
                    const arId = row.analysis_result_id ?? row.Analysis_Result_Id;
                    const submissionId = row.submission_id ?? row.Submission_Id;
                    const studentFid = row.student_file_id ?? row.Student_File_Id;
                    const guideFid = row.guide_file_id ?? row.Guide_File_Id;
                    const isSaved = savedResults.some(s => s === submissionId);
                    const hasManualMark = manualMarks[arId] !== "" && manualMarks[arId] !== undefined && manualMarks[arId] !== null;
                    const riskLevel = row.risk_level ?? "LOW";
                    const riskCls = riskLevel === "HIGH" ? "badge-red" : riskLevel === "MEDIUM" ? "badge-yellow" : "badge-green";
                    return (
                      <tr key={String(arId ?? submissionId ?? i)} className="tbl-row">
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className={`avatar ${avatarClass(i)}`} style={{ width: 30, height: 30, fontSize: 10 }}>G{i+1}</div>
                            <span className="mono" style={{ fontSize: 12, color: "#64748b" }}>#{submissionId}</span>
                          </div>
                        </td>
                        <td>
                          <a href={`${API_BASE}/api/marks/pdf/${studentFid}`} target="_blank" rel="noopener noreferrer" className="file-link">
                            <i className="fa-solid fa-file-pdf" style={{ fontSize: 11 }} />
                            Submission
                          </a>
                        </td>
                        <td>
                          <a href={`${API_BASE}/api/marks/pdf/${guideFid}`} target="_blank" rel="noopener noreferrer" className="file-link" style={{ background: "#f0fdf4", color: "#15803d" }}>
                            <i className="fa-solid fa-file-lines" style={{ fontSize: 11 }} />
                            Guide
                          </a>
                        </td>
                        <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12, color: "#475569" }}>
                          {row.assessment_name ?? row.Assessment_Name ?? "N/A"}
                        </td>
                        <td>
                          <button
                            className="score-btn"
                            onClick={() => { if (arId == null) return; navigate(`/lecturer/analysis/${arId}`, { state: row }); }}
                            title="Open ML analysis report"
                          >
                            {(row.final_score ?? row.Final_Score ?? 0).toFixed ? Number(row.final_score ?? row.Final_Score ?? 0).toFixed(1) : (row.final_score ?? row.Final_Score ?? 0)}
                          </button>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="mark-input"
                            placeholder="0.00"
                            value={manualMarks[arId] !== undefined ? manualMarks[arId] : ""}
                            onChange={handleManualMarkChange(arId, row.final_score ?? row.Final_Score, 100)}
                            disabled={isSaved}
                            step="0.01" min="0" max="100"
                          />
                        </td>
                        <td>
                          <span style={{ fontFamily: "Space Mono, monospace", fontWeight: 700, fontSize: 14, color: "#12b981" }}>
                            {finalMarks[arId] !== undefined ? finalMarks[arId].toFixed(2) : (row.final_score ?? row.Final_Score ?? 0)}
                          </span>
                        </td>
                        <td><span className={`badge ${riskCls}`}>{riskLevel}</span></td>
                        <td style={{ textAlign: "center" }}>
                          {isSaved
                            ? <span className="badge badge-teal"><i className="fa-solid fa-check" style={{ fontSize: 10 }} />Saved</span>
                            : hasManualMark
                              ? <span className="badge badge-blue">Ready</span>
                              : <span className="badge badge-gray">Pending</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LecturerSubmissions;
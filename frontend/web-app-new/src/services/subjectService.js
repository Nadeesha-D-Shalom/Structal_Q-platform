import axios from "axios";
import { getApiRoot } from "../api/client";

function formatSubjectLabel(row) {
  const code = String(row?.subject_code ?? row?.SubjectCode ?? "").trim();
  const name = String(row?.subject_name ?? row?.SubjectName ?? "").trim();
  if (code && name) return `${code} - ${name}`;
  return name || code || "";
}

/** Same default as CreateTimetable when the catalog is empty or the request fails. */
export const FALLBACK_SUBJECT_LABELS = ["CS402 - Advanced Algorithms"];

export async function fetchSubjectLabels() {
  try {
    const root = getApiRoot();
    const url = root ? `${root}/api/subjects` : "/api/subjects";
    const { data } = await axios.get(url);
    if (!Array.isArray(data)) return [...FALLBACK_SUBJECT_LABELS];
    const labels = [...new Set(data.map(formatSubjectLabel).filter(Boolean))];
    return labels.length ? labels.sort((a, b) => a.localeCompare(b)) : [...FALLBACK_SUBJECT_LABELS];
  } catch {
    return [...FALLBACK_SUBJECT_LABELS];
  }
}

/** SQL / JSON may return numbers as strings; mssql may serialize decimals oddly */
export function toNum(v, fallback = 0) {
  if (v == null || v === "") return fallback;
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** mssql / JSON may yield BigInt, Decimal-like objects, or numeric strings */
export function coerceIntId(v) {
  if (v == null || v === "") return NaN;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "object" && v != null && typeof v.valueOf === "function") {
    const x = v.valueOf();
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "bigint") return Number(x);
  }
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
}

export function normalizeQuestionScoreRow(q) {
  if (!q || typeof q !== "object") return null;
  const qid =
    q.question_id ??
    q.Question_Id ??
    q.questionId ??
    q.question_no ??
    q.Question_No;
  const sm =
    q.suggested_marks ??
    q.Suggested_Marks ??
    q.suggestedMarks;
  return {
    ...q,
    question_id: qid != null ? toNum(qid, 0) : 0,
    suggested_marks: sm != null ? toNum(sm, 0) : null,
  };
}

export function hasUsableAnalysisPayload(d) {
  if (!d) return false;
  const ar =
    d.analysis_result_id ??
    d.Analysis_Result_Id ??
    d.analysisResultId;
  const sub =
    d.submission_id ??
    d.Submission_Id ??
    d.submissionId;
  return ar != null || sub != null;
}

/** Pull ids from API/MSSQL rows even when key casing differs */
export function coerceAnalysisIds(d) {
  if (!d || typeof d !== "object") return { ar: null, sub: null };
  let ar =
    d.analysis_result_id ??
    d.Analysis_Result_Id ??
    d.analysisResultId;
  let sub =
    d.submission_id ??
    d.Submission_Id ??
    d.submissionId;
  if ((ar == null || ar === "") && (sub == null || sub === "")) {
    for (const k of Object.keys(d)) {
      const low = k.toLowerCase();
      if (low === "analysis_result_id" && d[k] != null && d[k] !== "") ar = d[k];
      if (low === "submission_id" && d[k] != null && d[k] !== "") sub = d[k];
    }
  }
  let arNum = ar != null && ar !== "" ? coerceIntId(ar) : NaN;
  let subNum = sub != null && sub !== "" ? coerceIntId(sub) : NaN;
  if (!Number.isFinite(arNum) || arNum <= 0) {
    for (const k of Object.keys(d)) {
      const low = k.toLowerCase();
      if (low.includes("analysis_result") && low.endsWith("id")) {
        const n = coerceIntId(d[k]);
        if (Number.isFinite(n) && n > 0) {
          arNum = n;
          break;
        }
      }
    }
  }
  if (!Number.isFinite(subNum) || subNum <= 0) {
    for (const k of Object.keys(d)) {
      const low = k.toLowerCase();
      if (low === "submission_id" || (low.endsWith("submission_id") && !low.includes("guide"))) {
        const n = coerceIntId(d[k]);
        if (Number.isFinite(n) && n > 0) {
          subNum = n;
          break;
        }
      }
    }
  }
  return {
    ar: Number.isFinite(arNum) && arNum > 0 ? arNum : null,
    sub: Number.isFinite(subNum) && subNum > 0 ? subNum : null,
  };
}

/** Map DB/API payload to fields the dashboard charts expect */
export function normalizeAnalysisPayload(raw) {
  if (!raw) return null;
  try {
    const d = { ...raw };

    if (typeof d.question_scores === "string") {
      try {
        const parsed = JSON.parse(d.question_scores);
        d.question_scores = Array.isArray(parsed) ? parsed : [];
      } catch {
        d.question_scores = [];
      }
    }

    const { ar, sub } = coerceAnalysisIds(d);
    if (ar != null) d.analysis_result_id = ar;
    if (sub != null) d.submission_id = sub;
    if (d.analysis_result_id == null && d.submission_id == null) return null;

    const simAvg = d.similarity_avg ?? d.Similarity_Avg;
    const structAvg = d.structural_similarity_avg ?? d.Structural_Similarity_Avg;

    if (d.semantic_similarity == null && simAvg != null) {
      d.semantic_similarity = toNum(simAvg);
    } else if (d.semantic_similarity != null) {
      d.semantic_similarity = toNum(d.semantic_similarity);
    }
    if (d.diagram_clarity == null && structAvg != null) {
      d.diagram_clarity = toNum(structAvg);
    } else if (d.diagram_clarity != null) {
      d.diagram_clarity = toNum(d.diagram_clarity);
    }
    if (d.final_score == null && simAvg != null) {
      d.final_score = toNum(simAvg) * 100;
    } else if (d.final_score != null) {
      d.final_score = toNum(d.final_score);
    }

    if (typeof d.diagram_analysis === "string") {
      try {
        d.diagram_analysis = JSON.parse(d.diagram_analysis);
      } catch {
        d.diagram_analysis = {};
      }
    }

    const keys = ["A", "B", "C", "D", "E", "F"];
    let qs = Array.isArray(d.question_scores)
      ? d.question_scores.map(normalizeQuestionScoreRow).filter(Boolean)
      : [];
    qs.sort((a, b) => toNum(a.question_id, 0) - toNum(b.question_id, 0));
    keys.forEach((k, i) => {
      if (d[`section_${k}`] == null && qs[i]) {
        const sm = qs[i].suggested_marks;
        d[`section_${k}`] = sm != null ? toNum(sm, 0) : 0;
      }
    });

    const gw =
      d.guide_weights && typeof d.guide_weights === "object" && !Array.isArray(d.guide_weights)
        ? { ...d.guide_weights }
        : {};
    keys.forEach((k) => {
      if (gw[k] == null) {
        const sec = d[`section_${k}`];
        gw[k] = { marks: sec != null && sec > 0 ? Math.max(toNum(sec, 0), 1) : 25 };
      }
    });
    d.guide_weights = gw;

    return d;
  } catch (e) {
    console.warn("normalizeAnalysisPayload:", e);
    return null;
  }
}

/**
 * Express returns { success, data }. Some layers may double-wrap; unwrap safely.
 */
export function unwrapAnalysisApiData(json) {
  if (json == null || typeof json !== "object") return null;
  if (json.success === false) return null;
  let row = json.data !== undefined ? json.data : json;
  if (row != null && typeof row === "object" && row.data !== undefined && !Array.isArray(row)) {
    row = row.data;
  }
  if (typeof row === "string") {
    try {
      row = JSON.parse(row);
    } catch {
      return null;
    }
  }
  return row;
}

import {
  hasUsableAnalysisPayload,
  normalizeAnalysisPayload,
  unwrapAnalysisApiData,
  coerceIntId,
} from "./analysisPayload";

describe("coerceIntId", () => {
  test("parses numeric strings", () => {
    expect(coerceIntId("114")).toBe(114);
  });
  test("handles bigint", () => {
    expect(coerceIntId(114n)).toBe(114);
  });
});

describe("unwrapAnalysisApiData", () => {
  test("returns data from { success, data }", () => {
    const row = { analysis_result_id: 114, submission_id: 2 };
    expect(unwrapAnalysisApiData({ success: true, data: row })).toEqual(row);
  });

  test("returns null on success false", () => {
    expect(unwrapAnalysisApiData({ success: false, error: "x" })).toBeNull();
  });

  test("parses string data as JSON", () => {
    const inner = { analysis_result_id: 5, submission_id: 1 };
    expect(
      unwrapAnalysisApiData({
        success: true,
        data: JSON.stringify(inner),
      })
    ).toEqual(inner);
  });
});

describe("normalizeAnalysisPayload", () => {
  test("normalizes a FULL_AI_ANALYSIS style row (like MSSQL export)", () => {
    const raw = {
      analysis_result_id: 114,
      submission_id: 2,
      marking_guide_id: 1,
      analysis_type: "FULL_AI_ANALYSIS",
      similarity_avg: 0.3853,
      structural_similarity_avg: 0.63,
      unique_word_ratio: 0.6147,
      risk_level: "MEDIUM",
      status: "COMPLETED",
    };
    const n = normalizeAnalysisPayload(raw);
    expect(n).not.toBeNull();
    expect(n.analysis_result_id).toBe(114);
    expect(n.submission_id).toBe(2);
    expect(hasUsableAnalysisPayload(n)).toBe(true);
    expect(n.final_score).toBeCloseTo(38.53, 1);
  });

  test("parses question_scores JSON string before building sections", () => {
    const qs = JSON.stringify([
      { question_id: 1, suggested_marks: 10 },
      { question_id: 2, suggested_marks: 20 },
    ]);
    const n = normalizeAnalysisPayload({
      analysis_result_id: 1,
      submission_id: 1,
      question_scores: qs,
    });
    expect(Array.isArray(n.question_scores)).toBe(true);
    expect(n.section_A).toBe(10);
    expect(n.section_B).toBe(20);
  });

  test("returns null when no ids can be resolved", () => {
    expect(
      normalizeAnalysisPayload({ similarity_avg: 0.5 })
    ).toBeNull();
  });

  test("accepts string ids from API", () => {
    const n = normalizeAnalysisPayload({
      analysis_result_id: "114",
      submission_id: "2",
      similarity_avg: 0.4,
    });
    expect(n.analysis_result_id).toBe(114);
    expect(n.submission_id).toBe(2);
  });
});

describe("hasUsableAnalysisPayload", () => {
  test("false for null", () => {
    expect(hasUsableAnalysisPayload(null)).toBe(false);
  });
  test("true with either id", () => {
    expect(hasUsableAnalysisPayload({ submission_id: 3 })).toBe(true);
    expect(hasUsableAnalysisPayload({ analysis_result_id: 9 })).toBe(true);
  });
});

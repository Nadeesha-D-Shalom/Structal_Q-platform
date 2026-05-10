
				
				
SELECT * FROM ai_question_score ORDER BY ai_q_score_id DESC;

SELECT TOP 1 * FROM analysis_result;

INSERT INTO guide_question (
    marking_guide_id,
    question_no,
    question_text,
    max_marks,
    model_answer_text,
    keyword_weight,
    semantic_weight
)
VALUES
(1, 1, 'Requirements Engineering', 15, 'Model answer A', 0.5, 0.5),
(1, 2, 'System Design', 45, 'Model answer B', 0.5, 0.5),
(1, 3, 'Implementation & CRUD', 20, 'Model answer C', 0.5, 0.5),
(1, 4, 'Database Design', 10, 'Model answer D', 0.5, 0.5),
(1, 5, 'Testing & Validation', 10, 'Model answer E', 0.5, 0.5),
(1, 6, 'Individual Contribution', 10, 'Model answer F', 0.5, 0.5);


SELECT 
    s.submission_id,
    f.original_file_name,
    a.similarity_avg
FROM submission s
JOIN file_storage f ON s.file_id = f.file_id
OUTER APPLY (
    SELECT TOP 1 *
    FROM analysis_result ar
    WHERE ar.submission_id = s.submission_id
    ORDER BY ar.analysis_result_id DESC
) a
WHERE f.is_deleted = 0;
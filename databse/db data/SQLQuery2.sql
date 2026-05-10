SELECT TOP 1 total_marks_awarded
FROM final_mark
WHERE submission_id = 2

select * from mark_alert;

INSERT INTO mark_alert (
    submission_id,
    alert_type,
    severity,
    message,
    created_at
)
VALUES (
    2,
    'DEVIATION',
    'HIGH',
    'High deviation between AI and lecturer marks',
    GETDATE()
)
SELECT AVG(confidence) FROM ai_question_score


ALTER TABLE mark_comparison
ADD is_anomaly BIT NOT NULL DEFAULT 0;

SELECT * FROM guide_rubric_item;

SELECT * FROM ai_rubric_score;
SELECT TOP 1 * FROM analysis_result

INSERT INTO guide_rubric_item (
    marking_guide_id,
    criterion_name,
    description,
    max_marks,
    weight,
    created_at
)
VALUES
(1, 'Structure Quality', 'Evaluates structure and organization', 10, 0.3, GETDATE()),
(1, 'Content Quality', 'Evaluates semantic correctness', 10, 0.4, GETDATE()),
(1, 'Diagram Quality', 'Evaluates diagrams', 10, 0.3, GETDATE());



SELECT * FROM subject_offering;
select * from marking_guide;
SELECT * FROM submission;
SELECT * FROM file_storage ;
select * from assessment;

select * from analysis_result;


select * from analysis_similarity_detail;

ALTER TABLE marking_guide
ADD file_id BIGINT;

UPDATE marking_guide
SET file_id = 2
WHERE marking_guide_id = 1;

ALTER TABLE marking_guide
ADD file_id BIGINT;

SELECT 
    mg.marking_guide_id AS guide_id,
    mg.title AS guide_name,
    fs.storage_path AS guide_file_path,
    a.assessment_title,
    s.subject_name
FROM marking_guide mg
LEFT JOIN file_storage fs 
    ON mg.file_id = fs.file_id
JOIN assessment a 
    ON mg.assessment_id = a.assessment_id
JOIN subject_offering so 
    ON a.offering_id = so.offering_id
JOIN subject s 
    ON so.subject_id = s.subject_id
WHERE mg.status = 'ACTIVE'
ORDER BY mg.created_at DESC


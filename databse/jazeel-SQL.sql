CREATE TABLE [user] (
  [user_id] bigint PRIMARY KEY IDENTITY(1,1),
  [first_name] nvarchar(255),
  [last_name] nvarchar(255),
  [email] nvarchar(255) UNIQUE,
  [password_hash] nvarchar(255),
  [role] nvarchar(255),
  [registration_no] nvarchar(255),
  [program_id] bigint,
  [status] nvarchar(255),
  [created_at] datetime,
  [updated_at] datetime,
  [last_login_at] datetime
)
GO

CREATE TABLE [subject] (
  [subject_id] bigint PRIMARY KEY IDENTITY(1,1),
  [subject_code] nvarchar(255),
  [subject_name] nvarchar(255),
  [credit_value] int,
  [department] nvarchar(255),
  [status] nvarchar(255),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [subject_offering] (
  [offering_id] bigint PRIMARY KEY IDENTITY(1,1),
  [subject_id] bigint NOT NULL,
  [academic_year] nvarchar(255),
  [semester] nvarchar(255),
  [intake_name] nvarchar(255),
  [is_active] bit,
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [assessment] (
  [assessment_id] bigint PRIMARY KEY IDENTITY(1,1),
  [offering_id] bigint NOT NULL,
  [assessment_title] nvarchar(255),
  [assessment_type] nvarchar(255),
  [total_marks] decimal(10,2),
  [start_date] datetime,
  [due_date] datetime,
  [allow_resubmission] bit,
  [max_resubmissions] int,
  [late_policy_enabled] bit,
  [grace_minutes] int,
  [requires_ai_analysis] bit,
  [created_by] bigint NOT NULL,
  [created_at] datetime,
  [updated_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [marking_guide] (
  [marking_guide_id] bigint PRIMARY KEY IDENTITY(1,1),
  [assessment_id] bigint NOT NULL,
  [version_no] int,
  [title] nvarchar(255),
  [description] nvarchar(max),
  [order_sensitive] bit,
  [requires_diagram_check] bit,
  [diagram_types_expected] nvarchar(max),
  [created_by] bigint NOT NULL,
  [created_at] datetime,
  [updated_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [guide_section_rule] (
  [section_rule_id] bigint PRIMARY KEY IDENTITY(1,1),
  [marking_guide_id] bigint NOT NULL,
  [section_name] nvarchar(255),
  [is_mandatory] bit,
  [expected_order] int,
  [min_words] int,
  [max_words] int,
  [created_at] datetime
)
GO

CREATE TABLE [guide_question] (
  [question_id] bigint PRIMARY KEY IDENTITY(1,1),
  [marking_guide_id] bigint NOT NULL,
  [question_no] int,
  [question_text] nvarchar(max),
  [max_marks] decimal(10,2),
  [model_answer_text] nvarchar(max),
  [keyword_weight] decimal(10,2),
  [semantic_weight] decimal(10,2),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [question_keyword] (
  [keyword_id] bigint PRIMARY KEY IDENTITY(1,1),
  [question_id] bigint NOT NULL,
  [keyword_text] nvarchar(255),
  [marks_weight] decimal(10,2),
  [is_mandatory] bit,
  [match_type] nvarchar(255),
  [created_at] datetime
)
GO

CREATE TABLE [guide_rubric_item] (
  [rubric_item_id] bigint PRIMARY KEY IDENTITY(1,1),
  [marking_guide_id] bigint NOT NULL,
  [criterion_name] nvarchar(255),
  [description] nvarchar(max),
  [max_marks] decimal(10,2),
  [weight] decimal(10,2),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [file_storage] (
  [file_id] bigint PRIMARY KEY IDENTITY(1,1),
  [original_file_name] nvarchar(255),
  [stored_file_name] nvarchar(255),
  [storage_category] nvarchar(255),
  [storage_path] nvarchar(255),
  [mime_type] nvarchar(255),
  [file_size_bytes] bigint,
  [sha256_hash] nvarchar(255),
  [upload_user_id] bigint NOT NULL,
  [uploaded_at] datetime,
  [is_deleted] bit
)
GO

CREATE TABLE [submission] (
  [submission_id] bigint PRIMARY KEY IDENTITY(1,1),
  [assessment_id] bigint NOT NULL,
  [student_id] bigint NOT NULL,
  [attempt_no] int,
  [submitted_at] datetime,
  [is_late] bit,
  [late_minutes] int,
  [file_id] bigint NOT NULL,
  [integrity_hash] nvarchar(255),
  [submission_status] nvarchar(255),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [analysis_result] (
  [analysis_result_id] bigint PRIMARY KEY IDENTITY(1,1),
  [submission_id] bigint NOT NULL,
  [marking_guide_id] bigint NOT NULL,
  [analysis_type] nvarchar(255),
  [similarity_max] decimal(10,2),
  [similarity_avg] decimal(10,2),
  [structural_similarity_avg] decimal(10,2),
  [missing_sections] nvarchar(max),
  [risk_score] decimal(10,2),
  [risk_level] nvarchar(255),
  [ocr_used] bit,
  [cv_used] bit,
  [started_at] datetime,
  [completed_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [analysis_similarity_detail] (
  [similarity_detail_id] bigint PRIMARY KEY IDENTITY(1,1),
  [analysis_result_id] bigint NOT NULL,
  [compared_submission_id] bigint NOT NULL,
  [semantic_similarity] decimal(10,2),
  [structural_similarity] decimal(10,2),
  [cluster_id] bigint,
  [created_at] datetime
)
GO

CREATE TABLE [ai_question_score] (
  [ai_q_score_id] bigint PRIMARY KEY IDENTITY(1,1),
  [analysis_result_id] bigint NOT NULL,
  [question_id] bigint NOT NULL,
  [keyword_matches] nvarchar(max),
  [keyword_score] decimal(10,2),
  [semantic_score] decimal(10,2),
  [suggested_marks] decimal(10,2),
  [confidence] decimal(10,2),
  [missing_keywords] nvarchar(max),
  [created_at] datetime
)
GO

CREATE TABLE [ai_rubric_score] (
  [ai_rubric_score_id] bigint PRIMARY KEY IDENTITY(1,1),
  [analysis_result_id] bigint NOT NULL,
  [rubric_item_id] bigint NOT NULL,
  [suggested_marks] decimal(10,2),
  [confidence] decimal(10,2),
  [evidence_excerpt] nvarchar(max),
  [created_at] datetime
)
GO

CREATE TABLE [ocr_page_result] (
  [ocr_id] bigint PRIMARY KEY IDENTITY(1,1),
  [analysis_result_id] bigint NOT NULL,
  [page_no] int,
  [ocr_text] nvarchar(max),
  [ocr_confidence] decimal(10,2),
  [has_diagram] bit,
  [created_at] datetime
)
GO

CREATE TABLE [diagram_check_result] (
  [diagram_check_id] bigint PRIMARY KEY IDENTITY(1,1),
  [analysis_result_id] bigint NOT NULL,
  [diagram_type] nvarchar(255),
  [page_no] int,
  [detected_labels] nvarchar(max),
  [expected_labels] nvarchar(max),
  [match_score] decimal(10,2),
  [issues] nvarchar(max),
  [created_at] datetime
)
GO

CREATE TABLE [final_mark] (
  [final_mark_id] bigint PRIMARY KEY IDENTITY(1,1),
  [submission_id] bigint NOT NULL,
  [lecturer_id] bigint NOT NULL,
  [total_marks_awarded] decimal(10,2),
  [marking_status] nvarchar(255),
  [validated_at] datetime,
  [published_at] datetime,
  [feedback_summary] nvarchar(max),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [final_question_mark] (
  [final_q_mark_id] bigint PRIMARY KEY IDENTITY(1,1),
  [final_mark_id] bigint NOT NULL,
  [question_id] bigint NOT NULL,
  [marks_awarded] decimal(10,2),
  [ai_suggested_snapshot] nvarchar(max),
  [deviation_value] decimal(10,2),
  [deviation_flag] bit,
  [created_at] datetime
)
GO

CREATE TABLE [mark_alert] (
  [alert_id] bigint PRIMARY KEY IDENTITY(1,1),
  [submission_id] bigint NOT NULL,
  [alert_type] nvarchar(255),
  [severity] nvarchar(255),
  [message] nvarchar(max),
  [acknowledged] bit,
  [acknowledged_by] bigint,
  [created_at] datetime
)
GO

CREATE TABLE [mark_concern] (
  [concern_id] bigint PRIMARY KEY IDENTITY(1,1),
  [final_mark_id] bigint NOT NULL,
  [student_id] bigint NOT NULL,
  [concern_text] nvarchar(max),
  [priority] nvarchar(255),
  [status] nvarchar(255),
  [submitted_at] datetime,
  [resolved_at] datetime
)
GO

CREATE TABLE [concern_window] (
  [concern_window_id] bigint PRIMARY KEY IDENTITY(1,1),
  [assessment_id] bigint NOT NULL,
  [opens_at] datetime,
  [closes_at] datetime,
  [duration_hours] int,
  [auto_close_enabled] bit,
  [created_by] bigint NOT NULL,
  [created_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [mark_revision_log] (
  [revision_id] bigint PRIMARY KEY IDENTITY(1,1),
  [final_mark_id] bigint NOT NULL,
  [lecturer_id] bigint NOT NULL,
  [old_mark] decimal(10,2),
  [new_mark] decimal(10,2),
  [revision_reason] nvarchar(max),
  [revised_at] datetime
)
GO

CREATE TABLE [audit_log] (
  [audit_id] bigint PRIMARY KEY IDENTITY(1,1),
  [actor_user_id] bigint NOT NULL,
  [action_type] nvarchar(255),
  [entity_name] nvarchar(255),
  [entity_id] nvarchar(255),
  [old_value_json] nvarchar(max),
  [new_value_json] nvarchar(max),
  [ip_address] nvarchar(255),
  [created_at] datetime
)
GO

CREATE TABLE [evaluation_location] (
  [location_id] bigint PRIMARY KEY IDENTITY(1,1),
  [location_name] nvarchar(255),
  [building_name] nvarchar(255),
  [room_number] nvarchar(255),
  [capacity] int,
  [available_from] time,
  [available_to] time,
  [status] nvarchar(255),
  [created_at] datetime
)
GO

CREATE TABLE [evaluation_schedule] (
  [evaluation_schedule_id] bigint PRIMARY KEY IDENTITY(1,1),
  [assessment_id] bigint NOT NULL,
  [location_id] bigint NOT NULL,
  [schedule_title] nvarchar(255),
  [date] date,
  [start_time] time,
  [end_time] time,
  [duration_per_group_minutes] int,
  [buffer_minutes] int,
  [total_groups] int,
  [is_published] bit,
  [published_at] datetime,
  [published_by] bigint,
  [draft_version_no] int,
  [created_by] bigint NOT NULL,
  [created_at] datetime,
  [updated_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [evaluation_slot] (
  [evaluation_slot_id] bigint PRIMARY KEY IDENTITY(1,1),
  [evaluation_schedule_id] bigint NOT NULL,
  [slot_sequence_no] int,
  [slot_start_time] time,
  [slot_end_time] time,
  [buffer_applied] bit,
  [slot_status] nvarchar(255),
  [created_at] datetime
)
GO

CREATE TABLE [evaluation_group_assignment] (
  [assignment_id] bigint PRIMARY KEY IDENTITY(1,1),
  [evaluation_slot_id] bigint NOT NULL,
  [group_id] nvarchar(255),
  [assigned_by] bigint NOT NULL,
  [assigned_at] datetime,
  [attendance_status] nvarchar(255),
  [evaluation_completed] bit,
  [remarks] nvarchar(max)
)
GO

CREATE TABLE [evaluation_email_log] (
  [email_log_id] bigint PRIMARY KEY IDENTITY(1,1),
  [evaluation_schedule_id] bigint NOT NULL,
  [recipient_user_id] bigint NOT NULL,
  [email_type] nvarchar(255),
  [sent_at] datetime,
  [delivery_status] nvarchar(255),
  [retry_count] int
)
GO

CREATE TABLE [evaluation_conflict_log] (
  [conflict_id] bigint PRIMARY KEY IDENTITY(1,1),
  [evaluation_schedule_id] bigint NOT NULL,
  [conflict_type] nvarchar(255),
  [conflict_description] nvarchar(max),
  [detected_at] datetime,
  [resolved] bit,
  [resolved_by] bigint,
  [resolved_at] datetime
)
GO

CREATE TABLE [exam_room] (
  [room_id] bigint PRIMARY KEY IDENTITY(1,1),
  [room_name] nvarchar(255),
  [building] nvarchar(255),
  [floor] nvarchar(255),
  [capacity] int,
  [has_projector] bit,
  [has_ac] bit,
  [is_available] bit,
  [created_at] datetime
)
GO

CREATE TABLE [exam_timetable] (
  [exam_timetable_id] bigint PRIMARY KEY IDENTITY(1,1),
  [academic_year] nvarchar(255),
  [semester] nvarchar(255),
  [title] nvarchar(255),
  [draft_version_no] int,
  [is_published] bit,
  [published_at] datetime,
  [published_by] bigint,
  [created_by] bigint NOT NULL,
  [created_at] datetime,
  [updated_at] datetime,
  [status] nvarchar(255)
)
GO

CREATE TABLE [exam_session] (
  [exam_session_id] bigint PRIMARY KEY IDENTITY(1,1),
  [exam_timetable_id] bigint NOT NULL,
  [subject_id] bigint NOT NULL,
  [room_id] bigint NOT NULL,
  [exam_type] nvarchar(255),
  [exam_date] date,
  [start_time] time,
  [end_time] time,
  [duration_minutes] int,
  [buffer_minutes] int,
  [expected_students_count] int,
  [session_status] nvarchar(255),
  [created_at] datetime,
  [updated_at] datetime
)
GO

CREATE TABLE [exam_capacity_tracking] (
  [capacity_id] bigint PRIMARY KEY IDENTITY(1,1),
  [exam_session_id] bigint NOT NULL,
  [room_id] bigint NOT NULL,
  [allocated_students] int,
  [remaining_capacity] int,
  [capacity_validated] bit,
  [validated_at] datetime
)
GO

CREATE TABLE [exam_conflict_log] (
  [conflict_id] bigint PRIMARY KEY IDENTITY(1,1),
  [exam_session_id] bigint NOT NULL,
  [conflict_type] nvarchar(255),
  [conflict_description] nvarchar(max),
  [detected_at] datetime,
  [resolved] bit,
  [resolved_by] bigint,
  [resolved_at] datetime
)
GO

CREATE TABLE [exam_notification_log] (
  [notification_id] bigint PRIMARY KEY IDENTITY(1,1),
  [exam_session_id] bigint NOT NULL,
  [user_id] bigint NOT NULL,
  [notification_type] nvarchar(255),
  [sent_at] datetime,
  [delivery_status] nvarchar(255)
)
GO

ALTER TABLE [subject_offering]
ADD FOREIGN KEY ([subject_id]) REFERENCES [subject] ([subject_id])
GO

ALTER TABLE [assessment]
ADD FOREIGN KEY ([offering_id]) REFERENCES [subject_offering] ([offering_id])
GO

ALTER TABLE [assessment]
ADD FOREIGN KEY ([created_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [marking_guide]
ADD FOREIGN KEY ([assessment_id]) REFERENCES [assessment] ([assessment_id])
GO

ALTER TABLE [marking_guide]
ADD FOREIGN KEY ([created_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [guide_section_rule]
ADD FOREIGN KEY ([marking_guide_id]) REFERENCES [marking_guide] ([marking_guide_id])
GO

ALTER TABLE [guide_question]
ADD FOREIGN KEY ([marking_guide_id]) REFERENCES [marking_guide] ([marking_guide_id])
GO

ALTER TABLE [question_keyword]
ADD FOREIGN KEY ([question_id]) REFERENCES [guide_question] ([question_id])
GO

ALTER TABLE [guide_rubric_item]
ADD FOREIGN KEY ([marking_guide_id]) REFERENCES [marking_guide] ([marking_guide_id])
GO

ALTER TABLE [file_storage]
ADD FOREIGN KEY ([upload_user_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [submission]
ADD FOREIGN KEY ([file_id]) REFERENCES [file_storage] ([file_id])
GO

ALTER TABLE [submission]
ADD FOREIGN KEY ([assessment_id]) REFERENCES [assessment] ([assessment_id])
GO

ALTER TABLE [submission]
ADD FOREIGN KEY ([student_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [analysis_result]
ADD FOREIGN KEY ([submission_id]) REFERENCES [submission] ([submission_id])
GO

ALTER TABLE [analysis_result]
ADD FOREIGN KEY ([marking_guide_id]) REFERENCES [marking_guide] ([marking_guide_id])
GO

ALTER TABLE [analysis_similarity_detail]
ADD FOREIGN KEY ([analysis_result_id]) REFERENCES [analysis_result] ([analysis_result_id])
GO

ALTER TABLE [analysis_similarity_detail]
ADD FOREIGN KEY ([compared_submission_id]) REFERENCES [submission] ([submission_id])
GO

ALTER TABLE [ai_question_score]
ADD FOREIGN KEY ([analysis_result_id]) REFERENCES [analysis_result] ([analysis_result_id])
GO

ALTER TABLE [ai_question_score]
ADD FOREIGN KEY ([question_id]) REFERENCES [guide_question] ([question_id])
GO

ALTER TABLE [ai_rubric_score]
ADD FOREIGN KEY ([analysis_result_id]) REFERENCES [analysis_result] ([analysis_result_id])
GO

ALTER TABLE [ai_rubric_score]
ADD FOREIGN KEY ([rubric_item_id]) REFERENCES [guide_rubric_item] ([rubric_item_id])
GO

ALTER TABLE [ocr_page_result]
ADD FOREIGN KEY ([analysis_result_id]) REFERENCES [analysis_result] ([analysis_result_id])
GO

ALTER TABLE [diagram_check_result]
ADD FOREIGN KEY ([analysis_result_id]) REFERENCES [analysis_result] ([analysis_result_id])
GO

ALTER TABLE [final_mark]
ADD FOREIGN KEY ([submission_id]) REFERENCES [submission] ([submission_id])
GO

ALTER TABLE [final_mark]
ADD FOREIGN KEY ([lecturer_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [final_question_mark]
ADD FOREIGN KEY ([final_mark_id]) REFERENCES [final_mark] ([final_mark_id])
GO

ALTER TABLE [final_question_mark]
ADD FOREIGN KEY ([question_id]) REFERENCES [guide_question] ([question_id])
GO

ALTER TABLE [mark_alert]
ADD FOREIGN KEY ([submission_id]) REFERENCES [submission] ([submission_id])
GO

ALTER TABLE [mark_alert]
ADD FOREIGN KEY ([acknowledged_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [mark_concern]
ADD FOREIGN KEY ([final_mark_id]) REFERENCES [final_mark] ([final_mark_id])
GO

ALTER TABLE [mark_concern]
ADD FOREIGN KEY ([student_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [concern_window]
ADD FOREIGN KEY ([assessment_id]) REFERENCES [assessment] ([assessment_id])
GO

ALTER TABLE [concern_window]
ADD FOREIGN KEY ([created_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [mark_revision_log]
ADD FOREIGN KEY ([final_mark_id]) REFERENCES [final_mark] ([final_mark_id])
GO

ALTER TABLE [mark_revision_log]
ADD FOREIGN KEY ([lecturer_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [audit_log]
ADD FOREIGN KEY ([actor_user_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [evaluation_schedule]
ADD FOREIGN KEY ([location_id]) REFERENCES [evaluation_location] ([location_id])
GO

ALTER TABLE [evaluation_schedule]
ADD FOREIGN KEY ([assessment_id]) REFERENCES [assessment] ([assessment_id])
GO

ALTER TABLE [evaluation_schedule]
ADD FOREIGN KEY ([created_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [evaluation_schedule]
ADD FOREIGN KEY ([published_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [evaluation_slot]
ADD FOREIGN KEY ([evaluation_schedule_id]) REFERENCES [evaluation_schedule] ([evaluation_schedule_id])
GO

ALTER TABLE [evaluation_group_assignment]
ADD FOREIGN KEY ([evaluation_slot_id]) REFERENCES [evaluation_slot] ([evaluation_slot_id])
GO

ALTER TABLE [evaluation_group_assignment]
ADD FOREIGN KEY ([assigned_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [evaluation_email_log]
ADD FOREIGN KEY ([evaluation_schedule_id]) REFERENCES [evaluation_schedule] ([evaluation_schedule_id])
GO

ALTER TABLE [evaluation_email_log]
ADD FOREIGN KEY ([recipient_user_id]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [evaluation_conflict_log]
ADD FOREIGN KEY ([evaluation_schedule_id]) REFERENCES [evaluation_schedule] ([evaluation_schedule_id])
GO

ALTER TABLE [evaluation_conflict_log]
ADD FOREIGN KEY ([resolved_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [exam_timetable]
ADD FOREIGN KEY ([created_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [exam_timetable]
ADD FOREIGN KEY ([published_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [exam_session]
ADD FOREIGN KEY ([exam_timetable_id]) REFERENCES [exam_timetable] ([exam_timetable_id])
GO

ALTER TABLE [exam_session]
ADD FOREIGN KEY ([subject_id]) REFERENCES [subject] ([subject_id])
GO

ALTER TABLE [exam_session]
ADD FOREIGN KEY ([room_id]) REFERENCES [exam_room] ([room_id])
GO

ALTER TABLE [exam_capacity_tracking]
ADD FOREIGN KEY ([exam_session_id]) REFERENCES [exam_session] ([exam_session_id])
GO

ALTER TABLE [exam_capacity_tracking]
ADD FOREIGN KEY ([room_id]) REFERENCES [exam_room] ([room_id])
GO

ALTER TABLE [exam_conflict_log]
ADD FOREIGN KEY ([exam_session_id]) REFERENCES [exam_session] ([exam_session_id])
GO

ALTER TABLE [exam_conflict_log]
ADD FOREIGN KEY ([resolved_by]) REFERENCES [user] ([user_id])
GO

ALTER TABLE [exam_notification_log]
ADD FOREIGN KEY ([exam_session_id]) REFERENCES [exam_session] ([exam_session_id])
GO

ALTER TABLE [exam_notification_log]
ADD FOREIGN KEY ([user_id]) REFERENCES [user] ([user_id])
GO


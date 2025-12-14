UPDATE worker_video_analysis_jobs
SET status = 'PENDING', "failure_reason" = NULL
WHERE id = 'f6f2e732-7357-43da-b344-ee4c6cc2adf4';

UPDATE worker_video_analysis_chunks
SET status = 'PENDING', "failure_reason" = NULL, "raw_gemini_response" = NULL
WHERE id = '14363d43-64b5-4aac-b183-7499893ada85';
-- Verify analytics snapshot was created
-- Run this query to check if a snapshot exists for today

SELECT 
  id,
  snapshot_date,
  snapshot_timestamp,
  total_sessions,
  total_users,
  sessions_this_month,
  completion_rate,
  average_report_length,
  average_board_size,
  created_at
FROM public.analytics_snapshots
ORDER BY snapshot_date DESC, snapshot_timestamp DESC
LIMIT 5;


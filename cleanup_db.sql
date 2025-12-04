-- This script cleans up the database by truncating all tables except for 'users' and 'migrations'.
-- It's designed to reset the application's data without affecting user accounts or the database schema version.
-- The 'RESTART IDENTITY' clause resets any auto-incrementing primary keys.
-- The 'CASCADE' clause ensures that any tables with foreign key references are also truncated.

BEGIN;

-- Truncate all tables except users and migrations
TRUNCATE TABLE public.game_events RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.game_player_stats RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.game_team_stats RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.games RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.player_team_history RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.players RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.teams RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.worker_video_analysis_chunks RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.worker_video_analysis_jobs RESTART IDENTITY CASCADE;

COMMIT;


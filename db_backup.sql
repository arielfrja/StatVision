--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: games_status_enum; Type: TYPE; Schema: public; Owner: statsvision
--

CREATE TYPE public.games_status_enum AS ENUM (
    'PENDING',
    'UPLOADED',
    'PROCESSING',
    'ANALYZED',
    'FAILED',
    'ANALYSIS_FAILED_RETRYABLE',
    'ANALYSIS_FAILED'
);


ALTER TYPE public.games_status_enum OWNER TO statsvision;

--
-- Name: players_position_enum; Type: TYPE; Schema: public; Owner: statsvision
--

CREATE TYPE public.players_position_enum AS ENUM (
    'PG',
    'SG',
    'SF',
    'PF',
    'C'
);


ALTER TYPE public.players_position_enum OWNER TO statsvision;

--
-- Name: worker_video_analysis_chunks_status_enum; Type: TYPE; Schema: public; Owner: statsvision
--

CREATE TYPE public.worker_video_analysis_chunks_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CHUNKING',
    'AWAITING_ANALYSIS',
    'ANALYZING',
    'RETRYABLE_FAILED'
);


ALTER TYPE public.worker_video_analysis_chunks_status_enum OWNER TO statsvision;

--
-- Name: worker_video_analysis_jobs_status_enum; Type: TYPE; Schema: public; Owner: statsvision
--

CREATE TYPE public.worker_video_analysis_jobs_status_enum AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'RETRYABLE_FAILED'
);


ALTER TYPE public.worker_video_analysis_jobs_status_enum OWNER TO statsvision;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: game_events; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.game_events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    game_id uuid NOT NULL,
    assigned_team_id uuid,
    assigned_player_id uuid,
    identified_team_color character varying,
    identified_jersey_number integer,
    event_type character varying NOT NULL,
    event_details jsonb,
    absolute_timestamp double precision NOT NULL,
    video_clip_start_time double precision,
    video_clip_end_time double precision,
    event_sub_type character varying,
    is_successful boolean DEFAULT false NOT NULL,
    period integer,
    time_remaining double precision,
    x_coord double precision,
    y_coord double precision,
    related_event_id uuid,
    on_court_player_ids text
);


ALTER TABLE public.game_events OWNER TO statsvision;

--
-- Name: game_player_stats; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.game_player_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    game_id uuid NOT NULL,
    player_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    details jsonb,
    minutes_played double precision DEFAULT '0'::double precision NOT NULL,
    plus_minus integer DEFAULT 0 NOT NULL,
    offensive_rebounds integer DEFAULT 0 NOT NULL,
    defensive_rebounds integer DEFAULT 0 NOT NULL,
    field_goals_made integer DEFAULT 0 NOT NULL,
    field_goals_attempted integer DEFAULT 0 NOT NULL,
    three_pointers_made integer DEFAULT 0 NOT NULL,
    three_pointers_attempted integer DEFAULT 0 NOT NULL,
    free_throws_made integer DEFAULT 0 NOT NULL,
    free_throws_attempted integer DEFAULT 0 NOT NULL,
    steals integer DEFAULT 0 NOT NULL,
    blocks integer DEFAULT 0 NOT NULL,
    turnovers integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL,
    effective_field_goal_percentage double precision DEFAULT '0'::double precision NOT NULL,
    true_shooting_percentage double precision DEFAULT '0'::double precision NOT NULL,
    team_id uuid,
    jersey_number integer,
    description character varying
);


ALTER TABLE public.game_player_stats OWNER TO statsvision;

--
-- Name: game_team_stats; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.game_team_stats (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    game_id uuid NOT NULL,
    team_id uuid NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL,
    details jsonb,
    offensive_rebounds integer DEFAULT 0 NOT NULL,
    defensive_rebounds integer DEFAULT 0 NOT NULL,
    field_goals_made integer DEFAULT 0 NOT NULL,
    field_goals_attempted integer DEFAULT 0 NOT NULL,
    three_pointers_made integer DEFAULT 0 NOT NULL,
    three_pointers_attempted integer DEFAULT 0 NOT NULL,
    free_throws_made integer DEFAULT 0 NOT NULL,
    free_throws_attempted integer DEFAULT 0 NOT NULL,
    steals integer DEFAULT 0 NOT NULL,
    blocks integer DEFAULT 0 NOT NULL,
    turnovers integer DEFAULT 0 NOT NULL,
    fouls integer DEFAULT 0 NOT NULL,
    effective_field_goal_percentage double precision DEFAULT '0'::double precision NOT NULL,
    true_shooting_percentage double precision DEFAULT '0'::double precision NOT NULL,
    type character varying,
    color character varying,
    description character varying
);


ALTER TABLE public.game_team_stats OWNER TO statsvision;

--
-- Name: games; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.games (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    status public.games_status_enum DEFAULT 'UPLOADED'::public.games_status_enum NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    name character varying DEFAULT 'Untitled Game'::character varying,
    file_path character varying,
    game_date date,
    location character varying,
    opponent_name character varying,
    quarter_duration integer,
    season character varying,
    home_team_id uuid,
    away_team_id uuid,
    "failedChunkInfo" jsonb
);


ALTER TABLE public.games OWNER TO statsvision;

--
-- Name: migrations; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.migrations OWNER TO statsvision;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: statsvision
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO statsvision;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: statsvision
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: player_team_history; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.player_team_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    player_id uuid NOT NULL,
    team_id uuid NOT NULL,
    jersey_number integer,
    description text,
    start_date date,
    end_date date
);


ALTER TABLE public.player_team_history OWNER TO statsvision;

--
-- Name: players; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.players (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    "position" public.players_position_enum,
    height integer,
    weight integer,
    is_active boolean DEFAULT true NOT NULL,
    "isTemp" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.players OWNER TO statsvision;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.teams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    "userId" uuid,
    "isTemp" boolean DEFAULT false NOT NULL
);


ALTER TABLE public.teams OWNER TO statsvision;

--
-- Name: users; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    provider_uid character varying NOT NULL,
    email character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO statsvision;

--
-- Name: worker_video_analysis_chunks; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.worker_video_analysis_chunks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    job_id uuid NOT NULL,
    chunk_path character varying NOT NULL,
    start_time double precision NOT NULL,
    sequence integer NOT NULL,
    status public.worker_video_analysis_chunks_status_enum DEFAULT 'PENDING'::public.worker_video_analysis_chunks_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    failure_reason text
);


ALTER TABLE public.worker_video_analysis_chunks OWNER TO statsvision;

--
-- Name: worker_video_analysis_jobs; Type: TABLE; Schema: public; Owner: statsvision
--

CREATE TABLE public.worker_video_analysis_jobs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    game_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_path character varying NOT NULL,
    status public.worker_video_analysis_jobs_status_enum DEFAULT 'PENDING'::public.worker_video_analysis_jobs_status_enum NOT NULL,
    "processedEvents" jsonb,
    "processedStats" jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    "identifiedPlayers" jsonb,
    "identifiedTeams" jsonb,
    retry_count integer DEFAULT 0 NOT NULL,
    processing_heartbeat_at timestamp with time zone,
    failure_reason text
);


ALTER TABLE public.worker_video_analysis_jobs OWNER TO statsvision;

--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Data for Name: game_events; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.game_events (id, game_id, assigned_team_id, assigned_player_id, identified_team_color, identified_jersey_number, event_type, event_details, absolute_timestamp, video_clip_start_time, video_clip_end_time, event_sub_type, is_successful, period, time_remaining, x_coord, y_coord, related_event_id, on_court_player_ids) FROM stdin;
\.


--
-- Data for Name: game_player_stats; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.game_player_stats (id, game_id, player_id, points, assists, details, minutes_played, plus_minus, offensive_rebounds, defensive_rebounds, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, steals, blocks, turnovers, fouls, effective_field_goal_percentage, true_shooting_percentage, team_id, jersey_number, description) FROM stdin;
\.


--
-- Data for Name: game_team_stats; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.game_team_stats (id, game_id, team_id, points, assists, details, offensive_rebounds, defensive_rebounds, field_goals_made, field_goals_attempted, three_pointers_made, three_pointers_attempted, free_throws_made, free_throws_attempted, steals, blocks, turnovers, fouls, effective_field_goal_percentage, true_shooting_percentage, type, color, description) FROM stdin;
\.


--
-- Data for Name: games; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.games (id, user_id, status, uploaded_at, name, file_path, game_date, location, opponent_name, quarter_duration, season, home_team_id, away_team_id, "failedChunkInfo") FROM stdin;
87fec8bc-d352-4768-a0a4-591a651a67b2	e1019f4d-7cef-44bc-8009-15cf6342dd11	FAILED	2025-11-14 11:44:04.470588	Test	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763113444611-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
012069ca-a7f8-487b-8246-33b57a05bb48	e1019f4d-7cef-44bc-8009-15cf6342dd11	UPLOADED	2025-11-14 13:16:42.228673	Test	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763119002329-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
e8798f61-7549-4da7-8d1e-053503afb7ce	e1019f4d-7cef-44bc-8009-15cf6342dd11	FAILED	2025-11-16 19:17:42.749485	Test 16.11.25-19:17	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763313462963-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
7c670ba4-9a75-4736-8545-4627d66218be	e1019f4d-7cef-44bc-8009-15cf6342dd11	FAILED	2025-11-16 21:03:23.157992	16-11-25-21-03	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763319803280-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
a0621d75-6e45-4069-8266-700d1c3c116d	e1019f4d-7cef-44bc-8009-15cf6342dd11	FAILED	2025-11-17 18:36:10.585166	20251711183556	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763397370728-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
0ea3ceb9-435a-4f48-b7e2-4440b63cd1bc	e1019f4d-7cef-44bc-8009-15cf6342dd11	FAILED	2025-11-17 19:02:34.027654	Test	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763398954100-clipped_video.webm	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.migrations (id, "timestamp", name) FROM stdin;
1	1762264184728	AddIsTempAndNullableVideoClipTimes1762264184728
2	1762341125575	AddCascadeDeleteToGameRelations1762341125575
3	1762886400000	ChunkRefactor1762886400000
4	1762861340144	AddFailureReasonToJob1762861340144
5	1762887400000	UpdateChunkStatusEnum1762887400000
\.


--
-- Data for Name: player_team_history; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.player_team_history (id, player_id, team_id, jersey_number, description, start_date, end_date) FROM stdin;
a406d3a4-85ae-4a29-87ae-1f5f0b1a0939	b6b220d0-2d3d-4730-9f74-c6038d9b5160	5680edd5-c572-46dd-b9cf-01c5536e5959	\N	Test description	2025-11-02	\N
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.players (id, name, created_at, updated_at, "position", height, weight, is_active, "isTemp") FROM stdin;
8ff48330-db55-40e7-a0b1-637cdba8b37f	Jayson Tatum	2025-10-25 22:00:15.096261	2025-10-25 22:00:15.096261	\N	\N	\N	t	f
0c4867e8-7231-492d-84a6-8a505958331a	Anthony Davis	2025-10-25 21:59:16.304034	2025-10-26 10:53:16.257627	\N	\N	\N	t	f
2c75ff46-c40d-42b9-9bb6-bda09d9c7079	Jimmy	2025-10-26 10:54:44.414959	2025-10-26 10:54:44.414959	\N	\N	\N	t	f
b6b220d0-2d3d-4730-9f74-c6038d9b5160	Test name	2025-11-02 13:14:43.135706	2025-11-02 13:14:43.135706	\N	\N	\N	t	f
7af64e9f-8f5a-474f-b4b6-5db9418c7a7c	Worker Player 5ac589f	2025-11-05 16:48:05.065713	2025-11-05 16:48:05.065713	\N	\N	\N	t	t
898d3ec3-cf2f-44a4-b1ac-163750168a48	Worker Player 8e641a5	2025-11-05 16:48:05.079497	2025-11-05 16:48:05.079497	\N	\N	\N	t	t
2db59731-e48b-4543-8139-f638f77b77e8	Worker Player 917efeb	2025-11-05 16:48:05.103771	2025-11-05 16:48:05.103771	\N	\N	\N	t	t
9498a9a2-9fcd-43b1-b3bc-2a996ae3f541	Worker Player c50c1ed	2025-11-05 16:48:05.131218	2025-11-05 16:48:05.131218	\N	\N	\N	t	t
780a0b93-f3c1-467f-9098-bc7de61cf84e	Worker Player c72ef83	2025-11-05 16:48:05.157987	2025-11-05 16:48:05.157987	\N	\N	\N	t	t
b6aa281e-e2de-46e6-aec7-7f6a0b9124d6	Worker Player 0e39ac6	2025-11-05 16:48:05.169088	2025-11-05 16:48:05.169088	\N	\N	\N	t	t
069c140d-ccd1-4c60-b9b8-9979e4a962d7	Worker Player d46951a	2025-11-05 16:48:05.177218	2025-11-05 16:48:05.177218	\N	\N	\N	t	t
7d587b73-50c8-4cbb-92c1-302ff945fc2e	Worker Player faedb9a	2025-11-05 16:48:05.220722	2025-11-05 16:48:05.220722	\N	\N	\N	t	t
150f93de-a0d6-4376-89ed-455b42284314	Worker Player 1ca4c8a	2025-11-05 16:48:05.227919	2025-11-05 16:48:05.227919	\N	\N	\N	t	t
d2e3c470-12ff-453b-b085-131304b1e6af	Worker Player 89f11ab	2025-11-05 16:48:05.234441	2025-11-05 16:48:05.234441	\N	\N	\N	t	t
479bff89-01d8-4e3f-bf9e-be1e76d9a501	Worker Player b18ddc3	2025-11-05 16:48:05.243079	2025-11-05 16:48:05.243079	\N	\N	\N	t	t
01f36d2d-5ae9-4780-8c5f-82dfc489e4f6	Worker Player e6b88b1	2025-11-05 16:48:05.250659	2025-11-05 16:48:05.250659	\N	\N	\N	t	t
e9beeb8e-2712-4b11-8313-e5a772be1338	Worker Player c3618fd	2025-11-05 16:48:05.257658	2025-11-05 16:48:05.257658	\N	\N	\N	t	t
b913e0ca-e5cb-49f4-832f-8d7e99d12c03	Worker Player 7e06562	2025-11-05 16:48:05.264763	2025-11-05 16:48:05.264763	\N	\N	\N	t	t
c7c6a603-bb74-4b79-9698-510e616b74e8	Worker Player e5f748c	2025-11-05 16:48:05.271832	2025-11-05 16:48:05.271832	\N	\N	\N	t	t
47b953d4-4a75-4e6f-985a-e8ac82fe838f	Worker Player 9f28a3d	2025-11-05 16:48:05.279973	2025-11-05 16:48:05.279973	\N	\N	\N	t	t
7e3966f6-a29e-4790-b0a6-f61a648f9e9d	Worker Player ce21967	2025-11-05 16:48:05.287505	2025-11-05 16:48:05.287505	\N	\N	\N	t	t
4b4801fc-88ab-419c-9b6f-6420db0e12df	Worker Player afabb3e	2025-11-05 16:48:05.335917	2025-11-05 16:48:05.335917	\N	\N	\N	t	t
30333b81-2313-4ea6-8d10-9f1c2adc5f1a	Worker Player ff02659	2025-11-05 16:48:05.35698	2025-11-05 16:48:05.35698	\N	\N	\N	t	t
f3db8222-ec85-49de-a20e-e957e9872d17	Worker Player 5d5e1c5	2025-11-05 16:48:05.366003	2025-11-05 16:48:05.366003	\N	\N	\N	t	t
f6ac42c9-6deb-480b-ae6d-51f4d8fd078c	Worker Player da0a294	2025-11-05 16:48:05.376033	2025-11-05 16:48:05.376033	\N	\N	\N	t	t
bf392c8b-9919-496b-8cb8-5ed79ced0194	Worker Player 4082c18	2025-11-05 16:48:05.386256	2025-11-05 16:48:05.386256	\N	\N	\N	t	t
25cffae4-ae3e-403c-9e9a-5b0235d42081	Worker Player dccf876	2025-11-05 16:48:05.396161	2025-11-05 16:48:05.396161	\N	\N	\N	t	t
01a24de3-bbc5-4edf-b147-719e66496885	Worker Player ae4f7de	2025-11-05 16:48:05.404505	2025-11-05 16:48:05.404505	\N	\N	\N	t	t
d49afadc-81ca-4a85-b56c-d06ecad70202	Worker Player 7ae118d	2025-11-05 16:48:05.412919	2025-11-05 16:48:05.412919	\N	\N	\N	t	t
20a9ba8d-ca25-4525-92d5-ef07896d2421	Worker Player c184fec	2025-11-05 16:48:05.421408	2025-11-05 16:48:05.421408	\N	\N	\N	t	t
28b9efed-0446-4f50-b12a-f44a8975def9	Worker Player b117a86	2025-11-05 16:48:05.42958	2025-11-05 16:48:05.42958	\N	\N	\N	t	t
e6ed2dde-7d04-41ea-9bcd-1c1a794b14d1	Worker Player 889daee	2025-11-05 16:48:05.438374	2025-11-05 16:48:05.438374	\N	\N	\N	t	t
f7767902-a86f-40d0-8b21-546b12811f88	Worker Player 549158f	2025-11-05 16:48:05.48164	2025-11-05 16:48:05.48164	\N	\N	\N	t	t
d7bfd368-c7c0-4e1e-85d8-09e446bec51e	Worker Player 6f8d18c	2025-11-05 16:48:05.489411	2025-11-05 16:48:05.489411	\N	\N	\N	t	t
92cf5103-2e41-403a-9783-c3cdfdbde44e	Worker Player 2dc7e5b	2025-11-05 16:48:05.496323	2025-11-05 16:48:05.496323	\N	\N	\N	t	t
16d9a617-1a78-4025-a340-562ddd32a414	Worker Player 62c83dc	2025-11-05 16:48:05.504077	2025-11-05 16:48:05.504077	\N	\N	\N	t	t
c55091d8-f620-4291-8b6f-eca14811f603	Worker Player 531a561	2025-11-05 16:48:05.511305	2025-11-05 16:48:05.511305	\N	\N	\N	t	t
ace0b4c9-ee3c-4a87-a545-429dcaf8b448	Worker Player 3e802db	2025-11-05 16:48:05.518523	2025-11-05 16:48:05.518523	\N	\N	\N	t	t
88ebf114-4132-4030-8883-cd5f8ac0b295	Worker Player 7e66e73	2025-11-05 16:48:05.525736	2025-11-05 16:48:05.525736	\N	\N	\N	t	t
25ff7ac3-f6d2-466a-b990-ede8255e58d9	Worker Player 0310eb1	2025-11-05 16:48:05.533816	2025-11-05 16:48:05.533816	\N	\N	\N	t	t
5aac7d1e-25d2-47e3-be46-6d90769d1a05	Worker Player 28a5143	2025-11-05 16:48:05.542513	2025-11-05 16:48:05.542513	\N	\N	\N	t	t
eedb8fae-2e12-4db0-8767-34db3cc53716	Worker Player 9243207	2025-11-05 16:48:05.550861	2025-11-05 16:48:05.550861	\N	\N	\N	t	t
50d792ec-74be-4e27-9503-98ce71cec5c9	Worker Player f8ee4d2	2025-11-05 16:48:05.559105	2025-11-05 16:48:05.559105	\N	\N	\N	t	t
4d0436a0-4376-4f17-a070-8894fa0eb26e	Worker Player a52ad6a	2025-11-05 16:48:05.600172	2025-11-05 16:48:05.600172	\N	\N	\N	t	t
ac636d4d-e1cb-4d41-bf17-6e7451d5eb67	Worker Player 7f289f7	2025-11-05 16:48:05.606302	2025-11-05 16:48:05.606302	\N	\N	\N	t	t
7acad668-b3d0-4809-acb1-0fccd82b9a5c	Worker Player 9b75414	2025-11-05 16:48:05.613448	2025-11-05 16:48:05.613448	\N	\N	\N	t	t
3c841112-05d5-42c9-9b72-ae55945eef1c	Worker Player 2b4b678	2025-11-05 16:48:05.620801	2025-11-05 16:48:05.620801	\N	\N	\N	t	t
1370ae3e-accb-477f-8ed0-3abedf7cc454	Worker Player ffea950	2025-11-05 16:48:05.627842	2025-11-05 16:48:05.627842	\N	\N	\N	t	t
2c0bf7f2-c493-4056-ace0-be866b266498	Worker Player 22a555a	2025-11-05 16:48:05.635386	2025-11-05 16:48:05.635386	\N	\N	\N	t	t
f76d6487-ee55-4515-99e4-2d0bcaf51072	Worker Player 8e6eadb	2025-11-05 16:48:05.64308	2025-11-05 16:48:05.64308	\N	\N	\N	t	t
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.teams (id, user_id, name, created_at, updated_at, "userId", "isTemp") FROM stdin;
01fccdde-0f9e-41f0-8021-f6db4997501c	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Lakers	2025-10-25 21:57:26.533321	2025-10-25 21:57:26.533321	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
00b62f10-1556-4143-be60-0b2a81ac97e2	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Celtics	2025-10-25 21:58:11.704226	2025-10-25 21:58:11.704226	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
4e32cfb2-b484-4a17-85fc-9c840cdf4c3a	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	 ibaccaM	2025-10-26 06:50:59.384298	2025-10-26 06:50:59.384298	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
5214ce45-5d4d-4b82-aa49-433356cfabd0	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Abcd	2025-10-26 10:02:07.18506	2025-10-26 10:02:07.18506	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
de9420dc-1fc1-4afe-8118-9c110481b618	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Maccabi 	2025-10-26 10:02:12.459048	2025-10-26 10:02:12.459048	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
00000000-0000-0000-0000-000000000001	e1019f4d-7cef-44bc-8009-15cf6342dd11	Test Team A	2025-10-30 12:38:49.436235	2025-10-30 12:38:49.436235	\N	f
4221cc91-808a-43a4-9455-76b8a5e4fc1d	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Test Team 6	2025-11-02 12:51:16.894765	2025-11-02 12:51:16.894765	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
5680edd5-c572-46dd-b9cf-01c5536e5959	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	Test Team	2025-11-02 13:14:16.725805	2025-11-02 13:14:16.725805	b8f86f72-e843-4c12-8e3d-54b9d321aaf7	f
6559a2c1-8c9d-4527-a0ac-e2d8da51de43	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 0f9f238	2025-11-05 16:48:04.825677	2025-11-05 16:48:04.825677	\N	t
68f60f94-f2c7-4dde-938a-05777e38ab6a	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 5618b07	2025-11-05 16:48:04.853515	2025-11-05 16:48:04.853515	\N	t
507856ab-e983-492e-b3d8-f020a2bcf372	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 618d576	2025-11-05 16:48:04.867092	2025-11-05 16:48:04.867092	\N	t
1e4436e8-a874-4099-bf70-4a15d9b9c798	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team bd38c26	2025-11-05 16:48:04.88205	2025-11-05 16:48:04.88205	\N	t
944830ba-c96c-4d76-b812-c593b12172e1	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team c8cdcff	2025-11-05 16:48:04.89358	2025-11-05 16:48:04.89358	\N	t
661a69a9-5660-42ae-9047-bfc796ce9880	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team f2e460e	2025-11-05 16:48:04.907203	2025-11-05 16:48:04.907203	\N	t
dc3359ff-549b-472e-9517-717bc06c8f81	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 35c6ba0	2025-11-05 16:48:04.961045	2025-11-05 16:48:04.961045	\N	t
40a3e01e-cb45-4a35-a23c-dd509e438837	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 1b67e6c	2025-11-05 16:48:04.991902	2025-11-05 16:48:04.991902	\N	t
690c2140-521b-4ba2-bb2c-05ea840be332	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 444da71	2025-11-05 16:48:05.011408	2025-11-05 16:48:05.011408	\N	t
9d115742-4313-4cbe-b1d0-bc78f7d5005c	e1019f4d-7cef-44bc-8009-15cf6342dd11	Worker Team 34e89a1	2025-11-05 16:48:05.033549	2025-11-05 16:48:05.033549	\N	t
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.users (id, provider_uid, email, created_at, updated_at) FROM stdin;
7237d1f2-583b-4d66-bb6f-ff721287ca38	3wO71w5UQ9b07rRckzltYdoZOM43	test@test.com	2025-10-22 20:40:21.127221	2025-10-22 20:40:21.127221
b8f86f72-e843-4c12-8e3d-54b9d321aaf7	google-oauth2|102923083580121191997	testuser@example.com	2025-10-24 14:36:19.606885	2025-10-24 14:36:19.606885
e1019f4d-7cef-44bc-8009-15cf6342dd11	google-oauth2|100283265907442009254	\N	2025-10-29 19:57:36.410688	2025-10-29 19:57:36.410688
\.


--
-- Data for Name: worker_video_analysis_chunks; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.worker_video_analysis_chunks (id, job_id, chunk_path, start_time, sequence, status, created_at, updated_at, failure_reason) FROM stdin;
22277f6c-5ff9-4026-8ce9-88efe05e264b	28431f41-ad19-49d1-bbec-dd9801d1d825	/data/data/com.termux/files/home/data/development/StatVision/backend/tmp/enhanced-chunk-1-1763398954100-clipped_video-120.mp4	120	1	FAILED	2025-11-17 19:08:48.97928	2025-11-18 17:13:28.865637	File files/1ehfqss99oxg did not become ACTIVE after 120s. Current state: FAILED
861f4ede-c950-4b4e-a98a-2a007eb2eaea	28431f41-ad19-49d1-bbec-dd9801d1d825		360	3	CHUNKING	2025-11-18 17:14:12.814389	2025-11-18 17:14:12.877123	\N
074626ff-29fe-4a02-adc4-20f62ed26017	28431f41-ad19-49d1-bbec-dd9801d1d825	/data/data/com.termux/files/home/data/development/StatVision/backend/tmp/enhanced-chunk-2-1763398954100-clipped_video-240.mp4	240	2	ANALYZING	2025-11-17 19:29:41.128136	2025-11-18 17:14:13.805118	\N
91b742ed-7d23-45ff-b458-f2c1813b6544	28431f41-ad19-49d1-bbec-dd9801d1d825	/data/data/com.termux/files/home/data/development/StatVision/backend/tmp/enhanced-chunk-0-1763398954100-clipped_video-0.mp4	0	0	COMPLETED	2025-11-17 19:02:47.891421	2025-11-17 19:08:49.321	\N
\.


--
-- Data for Name: worker_video_analysis_jobs; Type: TABLE DATA; Schema: public; Owner: statsvision
--

COPY public.worker_video_analysis_jobs (id, game_id, user_id, file_path, status, "processedEvents", "processedStats", created_at, updated_at, "identifiedPlayers", "identifiedTeams", retry_count, processing_heartbeat_at, failure_reason) FROM stdin;
4bf0274f-2513-4079-8102-d493405b0d13	87fec8bc-d352-4768-a0a4-591a651a67b2	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763113444611-clipped_video.webm	FAILED	\N	\N	2025-11-14 11:44:17.573097	2025-11-14 11:51:12.875275	\N	\N	0	2025-11-14 11:44:17.61+02	Job failed because 1 out of 2 chunk(s) failed processing.
52d4bbf5-a4b3-4562-860a-592945fe81e9	012069ca-a7f8-487b-8246-33b57a05bb48	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763119002329-clipped_video.webm	RETRYABLE_FAILED	\N	\N	2025-11-14 13:16:54.004255	2025-11-14 13:16:54.609602	\N	\N	1	2025-11-14 13:16:54.043+02	column Chunk.failure_reason does not exist
36ba2fb9-4ac7-4b85-9bcc-aa3081a96f91	e8798f61-7549-4da7-8d1e-053503afb7ce	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763313462963-clipped_video.webm	FAILED	\N	\N	2025-11-16 19:18:01.45425	2025-11-16 19:25:21.478679	\N	\N	0	2025-11-16 19:18:01.503+02	Job failed because 1 out of 2 chunk(s) failed processing.\nDetails:\nChunk 0: {"error":{"code":400,"message":"The File ksyc4x0ratoj is not in an ACTIVE state and usage is not allowed.","status":"FAILED_PRECONDITION"}}
28431f41-ad19-49d1-bbec-dd9801d1d825	0ea3ceb9-435a-4f48-b7e2-4440b63cd1bc	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763398954100-clipped_video.webm	FAILED	[]	\N	2025-11-17 19:02:46.757342	2025-11-18 17:13:29.117067	[]	[]	0	2025-11-18 17:08:24.518+02	Job failed because 1 out of 3 chunk(s) failed processing.\nDetails:\nChunk 1: File files/1ehfqss99oxg did not become ACTIVE after 120s. Current state: FAILED
d53663c5-7a52-4c09-817a-9608df08c483	7c670ba4-9a75-4736-8545-4627d66218be	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763319803280-clipped_video.webm	FAILED	\N	\N	2025-11-17 06:47:35.069635	2025-11-17 07:22:26.141013	\N	\N	0	2025-11-17 07:13:50.249+02	Job failed because 1 out of 2 chunk(s) failed processing.\nDetails:\nChunk 0: Unexpected token '`', "```json\n[\n"... is not valid JSON
f266a634-dafa-4cf8-872a-7a552a9193cf	a0621d75-6e45-4069-8266-700d1c3c116d	e1019f4d-7cef-44bc-8009-15cf6342dd11	/data/data/com.termux/files/home/data/development/StatVision/uploads/1763397370728-clipped_video.webm	FAILED	\N	\N	2025-11-17 18:36:21.580365	2025-11-17 18:47:35.725079	\N	\N	0	2025-11-17 18:47:17.079+02	Job failed because 1 out of 2 chunk(s) failed processing.\nDetails:\nChunk 0: exception TypeError: fetch failed sending request
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: statsvision
--

SELECT pg_catalog.setval('public.migrations_id_seq', 5, true);


--
-- Name: game_events PK_250946158c7913ba536add1e602; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT "PK_250946158c7913ba536add1e602" PRIMARY KEY (id);


--
-- Name: player_team_history PK_4fcf9cd8c9c36db784be411dbff; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT "PK_4fcf9cd8c9c36db784be411dbff" PRIMARY KEY (id);


--
-- Name: game_team_stats PK_5374fed357946ada19be752b685; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_team_stats
    ADD CONSTRAINT "PK_5374fed357946ada19be752b685" PRIMARY KEY (id);


--
-- Name: teams PK_7e5523774a38b08a6236d322403; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: worker_video_analysis_jobs PK_aff18774ad66cd53cb8ec90c72a; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.worker_video_analysis_jobs
    ADD CONSTRAINT "PK_aff18774ad66cd53cb8ec90c72a" PRIMARY KEY (id);


--
-- Name: games PK_c9b16b62917b5595af982d66337; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY (id);


--
-- Name: players PK_de22b8fdeee0c33ab55ae71da3b; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT "PK_de22b8fdeee0c33ab55ae71da3b" PRIMARY KEY (id);


--
-- Name: game_player_stats PK_ee300f155d92889da3a28c37343; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_player_stats
    ADD CONSTRAINT "PK_ee300f155d92889da3a28c37343" PRIMARY KEY (id);


--
-- Name: worker_video_analysis_chunks PK_some_descriptive_name; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.worker_video_analysis_chunks
    ADD CONSTRAINT "PK_some_descriptive_name" PRIMARY KEY (id);


--
-- Name: game_player_stats UQ_16eb7d7770a761474fa663e3877; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_player_stats
    ADD CONSTRAINT "UQ_16eb7d7770a761474fa663e3877" UNIQUE (game_id, player_id);


--
-- Name: game_team_stats UQ_670c0f65d79106a92048d12cdad; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_team_stats
    ADD CONSTRAINT "UQ_670c0f65d79106a92048d12cdad" UNIQUE (game_id, team_id);


--
-- Name: users UQ_abae2ee619bc6df194fbc17d831; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_abae2ee619bc6df194fbc17d831" UNIQUE (provider_uid);


--
-- Name: player_team_history UQ_af40d700cf50745a5ef41c7de32; Type: CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT "UQ_af40d700cf50745a5ef41c7de32" UNIQUE (player_id, team_id);


--
-- Name: game_events FK_19b219cef1db1f8c704be20bed5; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT "FK_19b219cef1db1f8c704be20bed5" FOREIGN KEY (assigned_player_id) REFERENCES public.players(id);


--
-- Name: game_team_stats FK_24db80fc834c0ee34f4aff01652; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_team_stats
    ADD CONSTRAINT "FK_24db80fc834c0ee34f4aff01652" FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: game_events FK_2a2f8c916a17d3dd045d1732063; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT "FK_2a2f8c916a17d3dd045d1732063" FOREIGN KEY (assigned_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: game_team_stats FK_32bf70b83d8835d675efc33e354; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_team_stats
    ADD CONSTRAINT "FK_32bf70b83d8835d675efc33e354" FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: game_player_stats FK_506e460acdef5a0c8b618270b16; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_player_stats
    ADD CONSTRAINT "FK_506e460acdef5a0c8b618270b16" FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: teams FK_5c5696b2c3c57698f890b2cbbdd; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT "FK_5c5696b2c3c57698f890b2cbbdd" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: game_events FK_5e9c9173e6d21d06023146b42e3; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT "FK_5e9c9173e6d21d06023146b42e3" FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: player_team_history FK_6718d122f4edf2f52421d8c11f6; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT "FK_6718d122f4edf2f52421d8c11f6" FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- Name: player_team_history FK_7c37895964aa8abdaa37b36416f; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.player_team_history
    ADD CONSTRAINT "FK_7c37895964aa8abdaa37b36416f" FOREIGN KEY (team_id) REFERENCES public.teams(id);


--
-- Name: game_player_stats FK_869be150c143225bf1eaed7edb0; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.game_player_stats
    ADD CONSTRAINT "FK_869be150c143225bf1eaed7edb0" FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;


--
-- Name: games FK_c26f4ceea870c6b52d767c2e24f; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT "FK_c26f4ceea870c6b52d767c2e24f" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: worker_video_analysis_chunks FK_f33d579840a12033320f4aacb11; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.worker_video_analysis_chunks
    ADD CONSTRAINT "FK_f33d579840a12033320f4aacb11" FOREIGN KEY (job_id) REFERENCES public.worker_video_analysis_jobs(id) ON DELETE CASCADE;


--
-- Name: games FK_f6bc2302c5abcb1237f534d6efc; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT "FK_f6bc2302c5abcb1237f534d6efc" FOREIGN KEY (home_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: games FK_fbe84ca8c9405ed07bf7d471883; Type: FK CONSTRAINT; Schema: public; Owner: statsvision
--

ALTER TABLE ONLY public.games
    ADD CONSTRAINT "FK_fbe84ca8c9405ed07bf7d471883" FOREIGN KEY (away_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--


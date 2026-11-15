-- CreatorFeed schema for Cloud SQL (PostgreSQL 17).
-- Derived from the Supabase public schema, minus Supabase-only parts:
--   * RLS policies using auth.uid()   -> authorization is enforced in API routes
--   * users.id FK to auth.users        -> users is now the source of truth
--   * handle_new_user() trigger        -> user creation happens in the Auth.js signIn callback
-- Run as a user that can CREATE EXTENSION (postgres), or create the extensions beforehand.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE FUNCTION public.increment_views(thread_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE threads 
  SET views = views + 1 
  WHERE id = thread_id;
END;
$$;

CREATE FUNCTION public.match_threads(query_embedding public.vector, match_threshold double precision, match_count integer, exclude_id uuid) RETURNS TABLE(id uuid, topic text, similarity double precision)
    LANGUAGE plpgsql
    AS $$
      BEGIN
        RETURN QUERY
        SELECT
          threads.id,
          threads.topic,
          1 - (threads.embedding <=> query_embedding) AS similarity
        FROM threads
        WHERE 1 - (threads.embedding <=> query_embedding) > match_threshold
          AND threads.status = 'published'
          AND threads.id != exclude_id
        ORDER BY threads.embedding <=> query_embedding
        LIMIT match_count;
      END;
      $$;

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE public.agent_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    agent_name text NOT NULL,
    expertise text NOT NULL,
    response_text text NOT NULL,
    round_number integer DEFAULT 1 NOT NULL,
    response_order integer NOT NULL,
    "position" text,
    final_position text,
    is_final_position boolean DEFAULT false,
    agreed_count integer DEFAULT 0,
    disagreed_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT agent_responses_position_check CHECK (("position" = ANY (ARRAY['agree'::text, 'partial'::text, 'disagree'::text])))
);

CREATE TABLE public.community_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    agent_response_id uuid,
    user_id uuid,
    reaction text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_reactions_reaction_check CHECK ((reaction = ANY (ARRAY['agreed'::text, 'disagreed'::text])))
);

CREATE TABLE public.human_replies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    user_id uuid,
    author_name text DEFAULT 'Anonymous'::text NOT NULL,
    agent_referenced text,
    sentiment text,
    reply_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT human_replies_agent_referenced_check CHECK ((agent_referenced = ANY (ARRAY['Axel'::text, 'Nova'::text, 'Leo'::text, 'Rex'::text, 'Sage'::text, 'Zara'::text]))),
    CONSTRAINT human_replies_sentiment_check CHECK ((sentiment = ANY (ARRAY['agreed'::text, 'disagreed'::text])))
);

CREATE TABLE public.intake_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    question_text text NOT NULL,
    question_type text NOT NULL,
    question_order integer NOT NULL,
    options jsonb,
    answer text,
    is_required boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT intake_questions_question_type_check CHECK ((question_type = ANY (ARRAY['multiple_choice'::text, 'open_text'::text])))
);

CREATE TABLE public.subscribers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active'::text
);

CREATE TABLE public.threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    raw_submission text NOT NULL,
    platform text,
    creator_handle text,
    follower_range text,
    creator_name text,
    user_id uuid,
    submitted_by text DEFAULT 'Anonymous'::text,
    intake_status text DEFAULT 'raw'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    topic text,
    what_tried text,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    ip_address text,
    user_agent text,
    embedding public.vector(384),
    source_url text,
    CONSTRAINT threads_intake_status_check CHECK ((intake_status = ANY (ARRAY['raw'::text, 'questioned'::text, 'ready'::text]))),
    CONSTRAINT threads_platform_check CHECK ((platform = ANY (ARRAY['YouTube'::text, 'Instagram'::text, 'TikTok'::text, 'Multi-platform'::text, 'Twitch'::text]))),
    CONSTRAINT threads_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'debating'::text, 'published'::text, 'failed'::text])))
);

CREATE TABLE public.users (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    karma integer DEFAULT 0,
    badges text[] DEFAULT '{}'::text[],
    is_admin boolean DEFAULT false
);

CREATE TABLE public.verdicts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    verdict_text text NOT NULL,
    key_takeaway_1 text NOT NULL,
    key_takeaway_2 text NOT NULL,
    key_takeaway_3 text NOT NULL,
    total_exchanges integer DEFAULT 0,
    total_rounds integer DEFAULT 0,
    consensus_reached boolean DEFAULT false,
    forced_by_cap boolean DEFAULT false,
    community_agree_percent integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.agent_responses
    ADD CONSTRAINT agent_responses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_agent_response_id_user_id_key UNIQUE (agent_response_id, user_id);

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.human_replies
    ADD CONSTRAINT human_replies_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.intake_questions
    ADD CONSTRAINT intake_questions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.verdicts
    ADD CONSTRAINT verdicts_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.verdicts
    ADD CONSTRAINT verdicts_thread_id_key UNIQUE (thread_id);

CREATE INDEX idx_agent_responses_round ON public.agent_responses USING btree (thread_id, round_number);

CREATE INDEX idx_agent_responses_thread_id ON public.agent_responses USING btree (thread_id);

CREATE INDEX idx_community_reactions_thread_id ON public.community_reactions USING btree (thread_id);

CREATE INDEX idx_community_reactions_user_id ON public.community_reactions USING btree (user_id);

CREATE INDEX idx_human_replies_thread_id ON public.human_replies USING btree (thread_id);

CREATE INDEX idx_human_replies_user_id ON public.human_replies USING btree (user_id);

CREATE INDEX idx_intake_questions_thread_id ON public.intake_questions USING btree (thread_id);

CREATE INDEX idx_threads_created_at ON public.threads USING btree (created_at DESC);

CREATE INDEX idx_threads_platform ON public.threads USING btree (platform);

CREATE INDEX idx_threads_rate_limit ON public.threads USING btree (ip_address, user_agent, user_id, created_at);

CREATE INDEX idx_threads_status ON public.threads USING btree (status);

CREATE INDEX idx_threads_user_id ON public.threads USING btree (user_id);

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE ONLY public.agent_responses
    ADD CONSTRAINT agent_responses_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_agent_response_id_fkey FOREIGN KEY (agent_response_id) REFERENCES public.agent_responses(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.community_reactions
    ADD CONSTRAINT community_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.human_replies
    ADD CONSTRAINT human_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.human_replies
    ADD CONSTRAINT human_replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.intake_questions
    ADD CONSTRAINT intake_questions_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.verdicts
    ADD CONSTRAINT verdicts_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

-- users.id was supplied by auth.users; generate it ourselves now.
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Replaces auth.identities: links an OAuth identity (e.g. Google "sub") to a user.
CREATE TABLE public.auth_accounts (
    provider text NOT NULL,
    provider_account_id text NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (provider, provider_account_id)
);
CREATE INDEX idx_auth_accounts_user_id ON public.auth_accounts USING btree (user_id);

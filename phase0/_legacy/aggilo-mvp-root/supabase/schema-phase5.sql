-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  SCHEMA ADDITIONS — Phase 5 MVP Implementation                 ║
-- ║  Run AFTER schema.sql in the Supabase SQL Editor                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Welfare notifications for founder/manager alerts
CREATE TABLE IF NOT EXISTS public.welfare_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id),
  user_id UUID REFERENCES public.profiles(id),
  trigger_content TEXT NOT NULL,
  sage_response TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clio ephemeral session metadata (content in browser sessionStorage for MVP)
CREATE TABLE IF NOT EXISTS public.clio_ephemeral_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  message_count INT DEFAULT 0,
  welfare_flagged BOOLEAN DEFAULT FALSE,
  welfare_escalated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Add post_subtype column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'post_subtype'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN post_subtype VARCHAR(32);
  END IF;
END $$;

-- Add country column to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN country VARCHAR(100);
  END IF;
END $$;

-- RLS for welfare_notifications: only founder/manager can read
ALTER TABLE public.welfare_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Founders and managers can view welfare notifications"
  ON public.welfare_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('founder', 'manager')
    )
  );

CREATE POLICY "System can insert welfare notifications"
  ON public.welfare_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Founders and managers can update welfare notifications"
  ON public.welfare_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('founder', 'manager')
    )
  );

-- RLS for clio_ephemeral_sessions: user sees only own sessions
ALTER TABLE public.clio_ephemeral_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  ONE-SHOT MIGRATION — Run in Supabase SQL Editor                ║
-- ║  Dashboard → SQL Editor → New Query → Paste → Run               ║
-- ║                                                                  ║
-- ║  This fixes the runtime errors:                                 ║
-- ║    "Could not find the 'post_subtype' column of 'posts'"        ║
-- ║    "column profiles.role does not exist"                        ║
-- ║                                                                  ║
-- ║  It is idempotent: safe to run multiple times.                  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 0) profiles.role  — required for welfare-notification RLS policies.
--    Older databases were created before this column landed; ensure it
--    exists FIRST so every policy below that references it can be created.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN role TEXT NOT NULL DEFAULT 'member';
  END IF;
END $$;

-- Add the role check constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND column_name = 'role'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('member', 'manager', 'founder'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation  THEN NULL;
END $$;

-- 0a) profiles.onboarded — referenced by ClusterShell.handleDismissWelcome
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarded'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN onboarded BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

-- 0b) profiles.gender — set during onboarding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN gender TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- 0c) posts.thread_state — Sage's message_review routing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'thread_state'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN thread_state TEXT NOT NULL DEFAULT 'unattended';
  END IF;
END $$;

-- 1) posts.post_subtype  — required by Sage host_content / dua flow
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'post_subtype'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN post_subtype VARCHAR(32);
  END IF;
END $$;

-- 2) profiles.country  — set during onboarding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN country VARCHAR(100);
  END IF;
END $$;

-- 3) welfare_notifications  — Sage welfare escalation target
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

ALTER TABLE public.welfare_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Founders and managers can view welfare notifications"
  ON public.welfare_notifications;
CREATE POLICY "Founders and managers can view welfare notifications"
  ON public.welfare_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert welfare notifications"
  ON public.welfare_notifications;
CREATE POLICY "System can insert welfare notifications"
  ON public.welfare_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Founders and managers can update welfare notifications"
  ON public.welfare_notifications;
CREATE POLICY "Founders and managers can update welfare notifications"
  ON public.welfare_notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('founder', 'manager')
    )
  );

-- 4) clio_ephemeral_sessions  — Clio ephemeral chat metadata
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

ALTER TABLE public.clio_ephemeral_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ephemeral sessions"
  ON public.clio_ephemeral_sessions;
CREATE POLICY "Users can view own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own ephemeral sessions"
  ON public.clio_ephemeral_sessions;
CREATE POLICY "Users can create own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own ephemeral sessions"
  ON public.clio_ephemeral_sessions;
CREATE POLICY "Users can update own ephemeral sessions"
  ON public.clio_ephemeral_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- 5) Force PostgREST schema cache refresh so new column is picked up
NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.1 ADDITIONS — Sage → Clio soft handoff                      ║
-- ║                                                                  ║
-- ║  When Sage chooses silence on a tender disclosure but private    ║
-- ║  follow-up would serve the member, Clio greets them in their    ║
-- ║  private tab. Member chooses whether to engage.                  ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 6) posts handoff metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'sage_handoff_to_clio_at'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN sage_handoff_to_clio_at TIMESTAMPTZ,
      ADD COLUMN sage_handoff_reason VARCHAR(32);
  END IF;
END $$;

-- 7) clio_handoff_greetings — pending private greetings for the user
CREATE TABLE IF NOT EXISTS public.clio_handoff_greetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggering_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  handoff_reason VARCHAR(32) NOT NULL,
  greeting_text TEXT NOT NULL,
  greeting_seen_at TIMESTAMPTZ,
  greeting_responded_at TIMESTAMPTZ,
  greeting_dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clio_handoff_greetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own handoff greetings"
  ON public.clio_handoff_greetings;
CREATE POLICY "Users can view own handoff greetings"
  ON public.clio_handoff_greetings FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own handoff greetings"
  ON public.clio_handoff_greetings;
CREATE POLICY "Users can update own handoff greetings"
  ON public.clio_handoff_greetings FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert handoff greetings"
  ON public.clio_handoff_greetings;
CREATE POLICY "System can insert handoff greetings"
  ON public.clio_handoff_greetings FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_handoff_greetings_user_unread
  ON public.clio_handoff_greetings(user_id)
  WHERE greeting_seen_at IS NULL;

-- Final reload
NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.2 ADDITIONS — Supabase Realtime publications                ║
-- ║                                                                  ║
-- ║  Make the soft handoff appear live: cluster note (posts UPDATE) ║
-- ║  and the private greeting (clio_handoff_greetings INSERT).      ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 8) Add clio_handoff_greetings to the realtime publication.
--    posts is already in supabase_realtime (added in schema.sql), but the
--    default publication only emits INSERT events unless explicitly told
--    otherwise. We re-add posts with all DML actions so UPDATE events
--    (the handoff stamp) flow through too.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.posts;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime
  ADD TABLE public.posts;

-- Add the new handoff table to realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'clio_handoff_greetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clio_handoff_greetings;
  END IF;
END $$;

-- Realtime requires REPLICA IDENTITY FULL on tables that emit UPDATE/DELETE
-- events with full row data. Without this, subscribers get only the changed
-- columns and Postgres can't tell which row was updated.
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.clio_handoff_greetings REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.3 ADDITIONS — Live Agent Collaboration Chatbox              ║
-- ║                                                                  ║
-- ║  The chatbox previously rendered hardcoded seed exchanges. We    ║
-- ║  now persist real exchanges that fire when Sage takes an action ║
-- ║  (e.g. autonomous dua post). Clio reviews the proposal; the     ║
-- ║  exchange is saved BEFORE the post is published, so members    ║
-- ║  can read the agents' collaboration in real time.              ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.agent_chatbox_exchanges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,                   -- the_single_source for MVP
  exchange_number INT NOT NULL,
  trigger_type VARCHAR(32) NOT NULL,          -- 'sage_dua' | 'cadence' | 'sage_initiated' | 'clio_initiated'
  triggering_observation TEXT,
  sage_message TEXT NOT NULL,
  clio_message TEXT NOT NULL,
  observe_mode BOOLEAN DEFAULT FALSE,
  features_proposed TEXT[] DEFAULT '{}',
  features_activated TEXT[] DEFAULT '{}',
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  sage_message_at TIMESTAMPTZ DEFAULT NOW(),
  clio_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chatbox_exchanges_cluster_recent
  ON public.agent_chatbox_exchanges(cluster_id, created_at DESC);

ALTER TABLE public.agent_chatbox_exchanges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view chatbox exchanges"
  ON public.agent_chatbox_exchanges;
CREATE POLICY "Authenticated users can view chatbox exchanges"
  ON public.agent_chatbox_exchanges FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert chatbox exchanges"
  ON public.agent_chatbox_exchanges;
CREATE POLICY "System can insert chatbox exchanges"
  ON public.agent_chatbox_exchanges FOR INSERT
  WITH CHECK (true);

-- Add to realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'agent_chatbox_exchanges'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_chatbox_exchanges;
  END IF;
END $$;

ALTER TABLE public.agent_chatbox_exchanges REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.4 ADDITIONS — Link unfurling + Sage on-topic check          ║
-- ║                                                                  ║
-- ║  When a member posts a URL, the platform fetches OpenGraph meta ║
-- ║  (title, description, image, site) and Sage evaluates whether   ║
-- ║  the link is on-topic for the cluster purpose. Members see a    ║
-- ║  link card with an optional Sage badge:                          ║
-- ║    ✓  On topic                                                   ║
-- ║    !  Sage notes: <one-line reason>                              ║
-- ║   (no badge if Sage cannot evaluate confidently)                ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL UNIQUE,           -- SHA-256 hex; for dedup + cache lookup
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  -- Sage's on-topic evaluation
  sage_verdict VARCHAR(16),                -- 'on_topic' | 'off_topic' | 'unsure' | null
  sage_reason TEXT,                        -- one-line explanation when off_topic
  evaluated_at TIMESTAMPTZ,
  -- Fetch outcome
  fetch_status INT,                        -- HTTP status of the OG fetch
  fetch_error TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_previews_url_hash
  ON public.link_previews(url_hash);

CREATE INDEX IF NOT EXISTS idx_link_previews_expires
  ON public.link_previews(expires_at);

ALTER TABLE public.link_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read link previews"
  ON public.link_previews;
CREATE POLICY "Authenticated users can read link previews"
  ON public.link_previews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert link previews"
  ON public.link_previews;
CREATE POLICY "System can insert link previews"
  ON public.link_previews FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update link previews"
  ON public.link_previews;
CREATE POLICY "System can update link previews"
  ON public.link_previews FOR UPDATE
  USING (true);

-- Add to realtime so the verdict streams in after the post lands
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'link_previews'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.link_previews;
  END IF;
END $$;

ALTER TABLE public.link_previews REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';

-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.4 — Vault seed (Sisters in Dua, 10 verified duas)           ║
-- ║  Idempotent: only inserts if the vault is currently empty.      ║
-- ║  Link alignment column on posts.                                ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- 9) posts.link_alignment — result of Sage's URL content evaluation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'link_alignment'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN link_alignment VARCHAR(16);
      -- Values: null (no link / not evaluated) | 'aligned' | 'misaligned' | 'evaluating'
  END IF;
END $$;

-- 10) posts.link_url — the first URL extracted from the post (for display card)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'link_url'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN link_url TEXT;
  END IF;
END $$;

-- 11) posts.link_meta — JSON: {title, description, thumbnail, site_name}
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'link_meta'
  ) THEN
    ALTER TABLE public.posts
      ADD COLUMN link_meta JSONB;
  END IF;
END $$;

-- 11b) link_previews — cached URL metadata + Sage alignment verdict
CREATE TABLE IF NOT EXISTS public.link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  image_url TEXT,
  site_name TEXT,
  sage_verdict VARCHAR(16),
  sage_reason TEXT,
  evaluated_at TIMESTAMPTZ,
  fetch_status INT,
  fetch_error TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_previews_url ON public.link_previews(url);

ALTER TABLE public.link_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view link previews" ON public.link_previews;
CREATE POLICY "Authenticated users can view link previews"
  ON public.link_previews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "System can upsert link previews" ON public.link_previews;
CREATE POLICY "System can upsert link previews"
  ON public.link_previews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update link previews" ON public.link_previews;
CREATE POLICY "System can update link previews"
  ON public.link_previews FOR UPDATE USING (true);

-- 12) Vault seed — only runs if the vault is empty
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.dua_vault) = 0 THEN
    INSERT INTO public.dua_vault (
      arabic_text, transliteration, translation, source_type,
      source_collection, source_hadith_number, source_chapter_verse,
      hadith_grade, occasion, thematic_tags, is_quranic,
      length_classification, verified_by_founder, title, notes
    ) VALUES

    (
      'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
      'Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth, aṣliḥ lī sha''nī kullahu, wa lā takilnī ilā nafsī ṭarfata ''ayn',
      'O Ever-Living, O Sustainer of all existence — by Your mercy I seek relief. Rectify all my affairs for me, and do not leave me to myself even for the blink of an eye.',
      'hadith', 'Jami'' at-Tirmidhi', 3524, NULL, 'hasan',
      ARRAY['general', 'morning', 'evening'],
      ARRAY['anxiety', 'hardship', 'reliance_on_allah', 'faith_renewal', 'sabr'],
      false, 'medium', true,
      'Du''a for the Soul That Feels Alone',
      'Narrated by Anas ibn Malik. Graded Hasan by al-Albani.'
    ),

    (
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ',
      'Allahumma inni as''aluka minal-khayri kullihi, ''ajilihi wa ajilihi, ma ''alimtu minhu wa ma lam a''lam. Wa a''udhu bika minash-sharri kullihi, ''ajilihi wa ajilihi, ma ''alimtu minhu wa ma lam a''lam.',
      'O Allah, I ask You for all that is good, in this world and in the Hereafter, what I know of it and what I do not know. And I seek refuge with You from all evil, in this world and in the Hereafter, what I know of it and what I do not know.',
      'hadith', 'Sunan Ibn Majah', 3846, NULL, 'sahih',
      ARRAY['general', 'morning', 'evening'],
      ARRAY['guidance_seeking', 'reliance_on_allah', 'sabr', 'shukr'],
      false, 'long', true,
      'Al-Dua Al-Jami'' (The Comprehensive Supplication)',
      'Taught by Prophet Muhammad ﷺ to Aisha (RA).'
    ),

    (
      'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
      'Allahumma inni a''udhu bika minal-hammi wal-hazan, wa a''udhu bika minal-''ajzi wal-kasal, wa a''udhu bika minal-jubni wal-bukhl, wa a''udhu bika min ghalabatid-dayni wa qahrir-rijal.',
      'O Allah, I seek refuge in You from anxiety and sorrow, from inability and laziness, from cowardice and miserliness, and from being overwhelmed by debt and overpowered by people.',
      'hadith', 'Sahih al-Bukhari', 6369, NULL, 'sahih',
      ARRAY['general', 'morning', 'evening'],
      ARRAY['anxiety', 'grief', 'hardship', 'sabr', 'reliance_on_allah'],
      false, 'medium', true,
      'Du''a for Anxiety and Sorrow',
      'Narrated by Anas ibn Malik. The Prophet ﷺ used to frequently say this supplication.'
    ),

    (
      'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
      'Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana ''abduka, wa ana ''ala ''ahdika wa wa''dika mastata''tu. A''udhu bika min sharri ma sana''tu. Abu''u laka bi ni''matika ''alayya, wa abu''u laka bi dhanbi. Faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.',
      'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me — for none forgives sins except You.',
      'hadith', 'Sahih al-Bukhari', 6306, NULL, 'sahih',
      ARRAY['morning', 'evening'],
      ARRAY['istighfar', 'faith_renewal', 'sabr', 'guidance_seeking'],
      false, 'long', true,
      'Sayyidul Istighfar (Master of Seeking Forgiveness)',
      'Narrated by Shaddad ibn Aws. The Prophet ﷺ said whoever says this during the day with firm faith and dies before evening will be among the people of Paradise.'
    ),

    (
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي',
      'Allahumma inni as''alukal-''afiyata fid-dunya wal-akhirah. Allahumma inni as''alukal-''afwa wal-''afiyata fi dini wa dunyaya wa ahli wa mali.',
      'O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly affairs, my family, and my wealth.',
      'hadith', 'Sunan Abu Dawud', 5074, NULL, 'sahih',
      ARRAY['morning', 'evening'],
      ARRAY['tawakkul', 'shukr', 'sabr', 'reliance_on_allah', 'guidance_seeking'],
      false, 'medium', true,
      'Du''a for Afiyah (Complete Well-being)',
      'Narrated by Abdullah ibn Umar. The Prophet ﷺ would never leave this supplication morning and evening.'
    ),

    (
      'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَارْزُقْنِي',
      'Allahumma ighfir li, warhamni, wahdini, warzuqni.',
      'O Allah, forgive me, have mercy on me, guide me, and provide for me.',
      'hadith', 'Sahih Muslim', 2696, NULL, 'sahih',
      ARRAY['general'],
      ARRAY['istighfar', 'guidance_seeking', 'sabr', 'faith_renewal'],
      false, 'short', true,
      'The Bedouin''s Du''a',
      'A Bedouin came to the Prophet ﷺ and embraced Islam. The Prophet ﷺ taught him this concise dua.'
    ),

    (
      'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
      'Rabbana la tu''akhidhna in nasina aw akhta''na. Rabbana wa la tahmil ''alayna isran kama hamaltahu ''alal-ladhina min qablina. Rabbana wa la tuhammilna ma la taqata lana bih. Wa''fu ''anna waghfir lana warhamna. Anta mawlana fansurna ''alal-qawmil-kafirin.',
      'Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us, and forgive us, and have mercy upon us. You are our protector, so give us victory over the disbelieving people.',
      'quran', 'Surah Al-Baqarah', NULL, '2:286', NULL,
      ARRAY['general', 'evening'],
      ARRAY['sabr', 'istighfar', 'hardship', 'reliance_on_allah', 'quran_reflection'],
      true, 'long', true,
      'Rabbana La Tu''akhidhna (End of Surah Al-Baqarah)',
      'The final ayah of Surah Al-Baqarah. The Prophet ﷺ said: "Allah has granted each of these supplications."'
    ),

    (
      'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, yuhyi wa yumitu, wa huwa hayyun la yamutu, biyadihil-khayru, wa huwa ''ala kulli shay''in qadir.',
      'There is no god but Allah, alone, without partner. To Him belongs sovereignty and to Him belongs praise. He gives life and causes death, and He is the Living who does not die. In His hand is all good, and He is over all things capable.',
      'hadith', 'Jami'' at-Tirmidhi', 3428, NULL, 'hasan',
      ARRAY['general'],
      ARRAY['dhikr', 'tawakkul', 'reliance_on_allah', 'shukr'],
      false, 'medium', true,
      'Du''a for Entering the Market',
      'Narrated by Umar ibn al-Khattab.'
    ),

    (
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا',
      'Allahumma inni as''alukul-jannata wa ma qarraba ilayha min qawlin aw ''amal, wa a''udhu bika minan-nari wa ma qarraba ilayha min qawlin aw ''amal, wa as''aluka an taj''ala kulla qada''in qadaytahu li khayra.',
      'O Allah, I ask You for Paradise and whatever brings me closer to it in word and deed, and I seek refuge with You from the Fire and whatever brings me closer to it in word and deed, and I ask You to make every decree You decree for me good.',
      'hadith', 'Sunan Ibn Majah', 3846, NULL, 'sahih',
      ARRAY['general'],
      ARRAY['guidance_seeking', 'tawakkul', 'sabr', 'reliance_on_allah'],
      false, 'long', true,
      'Supplication for Paradise and Good Decree',
      'Final part of the comprehensive supplication taught to Aisha (RA).'
    ),

    (
      'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
      'Ya Hayyu Ya Qayyum, bi rahmatika astaghith. Aslih li sha''ni kullahu, wa la takilni ila nafsi tarfata ''ayn.',
      'O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs for me, and do not entrust me to myself even for the blink of an eye.',
      'hadith', 'Mustadrak al-Hakim', 2000, NULL, 'hasan',
      ARRAY['general', 'morning', 'evening'],
      ARRAY['anxiety', 'hardship', 'reliance_on_allah', 'tawakkul'],
      false, 'short', true,
      'Supplication for Rectifying All Affairs',
      'Reported through multiple chains. A foundational supplication expressing complete dependence on Allah.'
    );

  END IF;
END $$;

NOTIFY pgrst, 'reload schema';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.5 — 7-Principles foundation                                 ║
-- ║                                                                  ║
-- ║  Closed loops, legible organization, software factories,        ║
-- ║  token-max observability, monotheism guardrail. Every table     ║
-- ║  here is the persistent memory the AI needs to self-improve.    ║
-- ║                                                                  ║
-- ║  Idempotent. Safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── 13) llm_response_logs ────────────────────────────────────────
-- Every LLM call. Cost, tokens, latency, decision summary, fallback flag.
-- Foundation for token-max measurement and closed-loop refinement.
CREATE TABLE IF NOT EXISTS public.llm_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent VARCHAR(32) NOT NULL,                -- 'sage' | 'clio' | 'cadence' | 'sage_dua_select' | 'clio_dua_review' | 'link_alignment'
  operation_key VARCHAR(64) NOT NULL,        -- 'sage_evaluate' | 'clio_chat' | 'clio_ephemeral' | 'sage_dua_select' | 'cadence_exchange' | etc.
  model VARCHAR(128),                        -- model id actually used
  base_url VARCHAR(256),                     -- to track primary vs fallback
  fallback_used BOOLEAN DEFAULT FALSE,
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  latency_ms INT,
  http_status INT,
  decision_summary VARCHAR(64),              -- 'silent' | 'responded' | 'cadence_blocked' | 'daily_cap' | 'no_signal' | 'pointer' | 'rejected' | 'approved' | 'refined' | 'error'
  error_message TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  cluster_id TEXT,
  cost_estimate_usd NUMERIC(10, 6),          -- per-call estimate; reconciled monthly
  prompt_hash VARCHAR(64),                   -- sha256 of system prompt — drift detection
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_logs_recent
  ON public.llm_response_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_logs_agent_op
  ON public.llm_response_logs(agent, operation_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_logs_user
  ON public.llm_response_logs(user_id, created_at DESC);

ALTER TABLE public.llm_response_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read llm logs" ON public.llm_response_logs;
CREATE POLICY "Admins can read llm logs"
  ON public.llm_response_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert llm logs" ON public.llm_response_logs;
CREATE POLICY "System can insert llm logs"
  ON public.llm_response_logs FOR INSERT
  WITH CHECK (true);

-- ── 14) sage_decision_logs ────────────────────────────────────────
-- Sage's framework decision on each post: which step matched, what was
-- considered, what was rejected. Closed loop on the message_review tree.
CREATE TABLE IF NOT EXISTS public.sage_decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  llm_log_id UUID REFERENCES public.llm_response_logs(id) ON DELETE SET NULL,
  step_matched VARCHAR(32),                  -- 'welfare' | 'character' | 'citation' | 'authority_redirect' | 'reference_surface' | 'care_witness' | 'witness_participation' | 'silent'
  step_rationale TEXT,                       -- model's explanation
  vault_id_considered UUID REFERENCES public.dua_vault(id) ON DELETE SET NULL,
  vault_id_used UUID REFERENCES public.dua_vault(id) ON DELETE SET NULL,
  response_text TEXT,                        -- null if SAGE_SILENT
  signals_detected JSONB DEFAULT '{}',       -- {welfare: bool, mentions_sage: bool, character_concern: bool}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sage_decisions_post
  ON public.sage_decision_logs(post_id);
CREATE INDEX IF NOT EXISTS idx_sage_decisions_step
  ON public.sage_decision_logs(step_matched, created_at DESC);

ALTER TABLE public.sage_decision_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read sage decisions" ON public.sage_decision_logs;
CREATE POLICY "Admins can read sage decisions"
  ON public.sage_decision_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert sage decisions" ON public.sage_decision_logs;
CREATE POLICY "System can insert sage decisions"
  ON public.sage_decision_logs FOR INSERT
  WITH CHECK (true);

-- ── 15) agent_feedback ────────────────────────────────────────────
-- 👍/👎 on Sage Timeline cards and Clio bubbles. Closes the loop on
-- agent quality.
CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent VARCHAR(16) NOT NULL,                -- 'sage' | 'clio'
  related_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  llm_log_id UUID REFERENCES public.llm_response_logs(id) ON DELETE SET NULL,
  signal VARCHAR(16) NOT NULL,               -- 'helpful' | 'unhelpful' | 'inappropriate' | 'inaccurate'
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, related_post_id, signal)   -- one signal per user per post
);

CREATE INDEX IF NOT EXISTS idx_agent_feedback_recent
  ON public.agent_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_post
  ON public.agent_feedback(related_post_id);

ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own feedback" ON public.agent_feedback;
CREATE POLICY "Users can read own feedback"
  ON public.agent_feedback FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.agent_feedback;
CREATE POLICY "Users can insert own feedback"
  ON public.agent_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own feedback" ON public.agent_feedback;
CREATE POLICY "Users can delete own feedback"
  ON public.agent_feedback FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all feedback" ON public.agent_feedback;
CREATE POLICY "Admins can read all feedback"
  ON public.agent_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- ── 16) behavioural_events ────────────────────────────────────────
-- Every meaningful user action. Foundation for AGGIL segment intelligence
-- (PRD 08) and Clio's prompt-improvisation loop. AGGIL-tagged at write time.
CREATE TABLE IF NOT EXISTS public.behavioural_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
    -- 'post_created' | 'post_replied' | 'post_liked' | 'reply_opened' |
    -- 'clio_message_sent' | 'clio_tab_switched' | 'clio_panel_opened' | 'clio_panel_closed' |
    -- 'dua_translation_revealed' | 'dua_pointer_followed' |
    -- 'agent_thoughts_opened' | 'agent_thoughts_minimized' |
    -- 'handoff_greeting_seen' | 'handoff_greeting_responded' | 'handoff_greeting_dismissed' |
    -- 'link_card_opened' | 'feature_upvoted' | 'feature_commented' |
    -- 'sage_feedback_given' | 'clio_feedback_given' |
    -- 'cluster_landed' | 'session_started'
  cluster_id TEXT,
  event_data JSONB DEFAULT '{}',
  -- AGGIL snapshot at event time (denormalized — segments shift over time)
  country VARCHAR(64),
  gender VARCHAR(16),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behav_events_recent
  ON public.behavioural_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behav_events_user
  ON public.behavioural_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behav_events_type
  ON public.behavioural_events(event_type, created_at DESC);

ALTER TABLE public.behavioural_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read behavioural events" ON public.behavioural_events;
CREATE POLICY "Admins can read behavioural events"
  ON public.behavioural_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert behavioural events" ON public.behavioural_events;
CREATE POLICY "System can insert behavioural events"
  ON public.behavioural_events FOR INSERT
  WITH CHECK (true);

-- ── 17) character_concerns ────────────────────────────────────────
-- Monotheism guardrail. When a message rejects God, mocks faith, promotes
-- bad character, or coerces against practice — Sage logs here, admin sees
-- in dashboard and can step in. Soul cross-cutting principle.
CREATE TABLE IF NOT EXISTS public.character_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  signal_type VARCHAR(48) NOT NULL,
    -- 'rejecting_monotheism' | 'mocking_faith' | 'promoting_bad_character' |
    -- 'coercion_against_practice' | 'dismissing_dua' | 'other'
  signal_excerpt TEXT NOT NULL,              -- ≤500 chars from the post
  agent_response_text TEXT,                  -- what Sage said
  admin_notified_at TIMESTAMPTZ DEFAULT NOW(),
  admin_response TEXT,
  admin_responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_concerns_unresolved
  ON public.character_concerns(created_at DESC)
  WHERE resolved_at IS NULL;

ALTER TABLE public.character_concerns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read character concerns" ON public.character_concerns;
CREATE POLICY "Admins can read character concerns"
  ON public.character_concerns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can update character concerns" ON public.character_concerns;
CREATE POLICY "Admins can update character concerns"
  ON public.character_concerns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert character concerns" ON public.character_concerns;
CREATE POLICY "System can insert character concerns"
  ON public.character_concerns FOR INSERT
  WITH CHECK (true);

-- Realtime — admin dashboard surfaces these immediately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'character_concerns'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.character_concerns;
  END IF;
END $$;
ALTER TABLE public.character_concerns REPLICA IDENTITY FULL;

-- Welfare notifications also need realtime for the admin nav badge
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'welfare_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.welfare_notifications;
  END IF;
END $$;
ALTER TABLE public.welfare_notifications REPLICA IDENTITY FULL;

-- ── 18) vault_gap_requests ────────────────────────────────────────
-- When Sage detects an incomplete dua but vault + Tier 1 lack a verified
-- version, she flags a gap. Admin sees in vault curator and can add.
-- "No human middleware" — Sage routes to admin without a polling step.
CREATE TABLE IF NOT EXISTS public.vault_gap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  member_text TEXT NOT NULL,                 -- excerpt that triggered the gap
  sage_search_attempted TEXT,                -- what Sage looked for
  suggested_thematic_tags TEXT[] DEFAULT '{}',
  status VARCHAR(16) DEFAULT 'open',         -- 'open' | 'addressed' | 'dismissed'
  resolved_vault_id UUID REFERENCES public.dua_vault(id) ON DELETE SET NULL,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_gaps_open
  ON public.vault_gap_requests(created_at DESC)
  WHERE status = 'open';

ALTER TABLE public.vault_gap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vault gaps" ON public.vault_gap_requests;
CREATE POLICY "Admins manage vault gaps"
  ON public.vault_gap_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert vault gaps" ON public.vault_gap_requests;
CREATE POLICY "System can insert vault gaps"
  ON public.vault_gap_requests FOR INSERT
  WITH CHECK (true);

-- ── 19) vault_sources ─────────────────────────────────────────────
-- Admin-managed list of trusted sources. For MVP these are stored but
-- not yet auto-pulled. Sage/Clio can suggest "we should add this source"
-- as feature proposals; admin approves and adds here.
CREATE TABLE IF NOT EXISTS public.vault_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name VARCHAR(128) NOT NULL,         -- 'Sahih al-Bukhari' | 'Sunnah.com' | 'Quran.com'
  source_type VARCHAR(32) NOT NULL,          -- 'api' | 'rss' | 'manual'
  base_url TEXT,
  api_key_env VARCHAR(64),                   -- name of env var holding the key (never the key itself)
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage vault sources" ON public.vault_sources;
CREATE POLICY "Admins manage vault sources"
  ON public.vault_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- ── 20) cluster_features ──────────────────────────────────────────
-- Features tab. Agents propose in Agent Thoughts; on Clio approval they
-- surface here for member upvote/comment. MVP doesn't develop the tools,
-- but the polling and feedback loop is real — "your feedback matters."
CREATE TABLE IF NOT EXISTS public.cluster_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  display_description TEXT NOT NULL,
  category VARCHAR(48),                      -- 'reflection' | 'reminder' | 'tracking' | 'reference' | 'community'
  status VARCHAR(32) DEFAULT 'in_features_tab',
    -- 'proposed_in_thoughts' | 'in_features_tab' | 'members_engaged' |
    -- 'admin_approved' | 'in_development' | 'live' | 'deferred' | 'rejected'
  proposed_by VARCHAR(16) NOT NULL,          -- 'sage' | 'clio' | 'agents_joint'
  rationale TEXT,                            -- one-paragraph explanation
  chatbox_exchange_id UUID REFERENCES public.agent_chatbox_exchanges(id) ON DELETE SET NULL,
  upvote_count INT DEFAULT 0,                -- denormalized
  comment_count INT DEFAULT 0,               -- denormalized
  admin_decision_note TEXT,
  admin_decision_at TIMESTAMPTZ,
  admin_decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_eta VARCHAR(48),                 -- 'Q3 2026' | 'next sprint' | etc.
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cluster_features_visible
  ON public.cluster_features(cluster_id, status, upvote_count DESC);

ALTER TABLE public.cluster_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read features" ON public.cluster_features;
CREATE POLICY "Authenticated users read features"
  ON public.cluster_features FOR SELECT
  TO authenticated
  USING (status NOT IN ('rejected', 'deferred', 'proposed_in_thoughts'));

DROP POLICY IF EXISTS "Admins read all features" ON public.cluster_features;
CREATE POLICY "Admins read all features"
  ON public.cluster_features FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert features" ON public.cluster_features;
CREATE POLICY "System can insert features"
  ON public.cluster_features FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins update features" ON public.cluster_features;
CREATE POLICY "Admins update features"
  ON public.cluster_features FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- ── 21) cluster_feature_upvotes ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cluster_feature_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.cluster_features(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, user_id)
);

ALTER TABLE public.cluster_feature_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read upvotes" ON public.cluster_feature_upvotes;
CREATE POLICY "Authenticated users read upvotes"
  ON public.cluster_feature_upvotes FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own upvotes" ON public.cluster_feature_upvotes;
CREATE POLICY "Users manage own upvotes"
  ON public.cluster_feature_upvotes FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 22) cluster_feature_comments ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cluster_feature_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.cluster_features(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  hidden BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_comments_feature
  ON public.cluster_feature_comments(feature_id, created_at DESC);

ALTER TABLE public.cluster_feature_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read comments" ON public.cluster_feature_comments;
CREATE POLICY "Authenticated users read comments"
  ON public.cluster_feature_comments FOR SELECT
  TO authenticated
  USING (NOT hidden);

DROP POLICY IF EXISTS "Users insert own comments" ON public.cluster_feature_comments;
CREATE POLICY "Users insert own comments"
  ON public.cluster_feature_comments FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins moderate comments" ON public.cluster_feature_comments;
CREATE POLICY "Admins moderate comments"
  ON public.cluster_feature_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- ── 23) agent_prompt_proposals ────────────────────────────────────
-- Clio's prompt-improvisation loop. Clio reads logs/feedback/behaviour,
-- drafts a refined prompt for Sage, writes here. Admin reviews, activates.
-- "AI as OS": the AI improvises its own prompts based on observed reality.
CREATE TABLE IF NOT EXISTS public.agent_prompt_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposed_by VARCHAR(16) NOT NULL,          -- 'clio' | 'admin'
  target_agent VARCHAR(16) NOT NULL,         -- 'sage' | 'clio'
  base_prompt_hash VARCHAR(64),              -- the hash of the prompt this proposal is based on
  proposed_prompt TEXT NOT NULL,
  rationale TEXT NOT NULL,                   -- why — what Clio observed
  evidence JSONB DEFAULT '{}',               -- counts, sample post ids, feedback summary
  status VARCHAR(16) DEFAULT 'pending',      -- 'pending' | 'approved' | 'rejected' | 'superseded'
  admin_decision_at TIMESTAMPTZ,
  admin_decision_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_decision_note TEXT,
  activated_at TIMESTAMPTZ,
  superseded_by UUID REFERENCES public.agent_prompt_proposals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_proposals_pending
  ON public.agent_prompt_proposals(target_agent, created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.agent_prompt_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage prompt proposals" ON public.agent_prompt_proposals;
CREATE POLICY "Admins manage prompt proposals"
  ON public.agent_prompt_proposals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

DROP POLICY IF EXISTS "System can insert prompt proposals" ON public.agent_prompt_proposals;
CREATE POLICY "System can insert prompt proposals"
  ON public.agent_prompt_proposals FOR INSERT
  WITH CHECK (true);

-- ── 24) agent_chatbox_views ───────────────────────────────────────
-- Per-user view tracking for Agent Thoughts. Server-side lets state
-- persist across devices.
CREATE TABLE IF NOT EXISTS public.agent_chatbox_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  last_viewed_exchange INT DEFAULT 0,
  minimized BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

ALTER TABLE public.agent_chatbox_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own chatbox views" ON public.agent_chatbox_views;
CREATE POLICY "Users manage own chatbox views"
  ON public.agent_chatbox_views FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 25) Auto-elevate admin on first login ─────────────────────────
-- The Edge of "no human middleware" + "DRI archetype": email allowlist
-- (env-managed) auto-promotes profiles to 'founder' role on creation.
-- We can't read env vars from inside Postgres, so we wire the allowlist
-- check into the existing handle_new_user trigger via a settings table.
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins manage platform settings"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('founder', 'manager')
    )
  );

-- Updated trigger: auto-promote if email matches admin_emails setting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_csv TEXT;
  is_admin BOOLEAN := FALSE;
BEGIN
  SELECT value INTO admin_csv FROM public.platform_settings WHERE key = 'admin_emails';
  IF admin_csv IS NOT NULL AND NEW.email IS NOT NULL THEN
    is_admin := position(lower(NEW.email) in lower(admin_csv)) > 0;
  END IF;

  INSERT INTO public.profiles (id, nickname, role)
  VALUES (
    NEW.id,
    COALESCE(split_part(NEW.email, '@', 1), 'Sister'),
    CASE WHEN is_admin THEN 'founder' ELSE 'member' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.6 — Feature upvote count trigger                            ║
-- ║                                                                  ║
-- ║  Keeps cluster_features.upvote_count in sync with the actual    ║
-- ║  count of cluster_feature_upvotes rows. The denormalized counter║
-- ║  lets the Features tab sort by popularity without a join.       ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.refresh_feature_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.cluster_features
       SET upvote_count = upvote_count + 1,
           updated_at = NOW()
     WHERE id = NEW.feature_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.cluster_features
       SET upvote_count = GREATEST(0, upvote_count - 1),
           updated_at = NOW()
     WHERE id = OLD.feature_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS feature_upvote_count_trigger
  ON public.cluster_feature_upvotes;

CREATE TRIGGER feature_upvote_count_trigger
  AFTER INSERT OR DELETE ON public.cluster_feature_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_feature_upvote_count();

NOTIFY pgrst, 'reload schema';

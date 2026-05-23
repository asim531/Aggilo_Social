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


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.7 — Two-Track Capability Model: Tools and Features          ║
-- ║                                                                  ║
-- ║  Renames the member-facing surface from "Agent Thoughts" to      ║
-- ║  "Room Workshop" and introduces the two-track distinction.       ║
-- ║                                                                  ║
-- ║  Track 1 — Agent Tools (kind = 'agent_tool')                    ║
-- ║    • Things Sage/Clio run on behalf of the room.                ║
-- ║    • Members receive output, never click anything.              ║
-- ║    • No member vote required. Agents deploy autonomously         ║
-- ║      within rules. Admin can veto. Logged to admin in real time. ║
-- ║    • Examples: tajweed formatter, daily reflection prompt,       ║
-- ║      verified-reference digest, gentle reminders.                ║
-- ║                                                                  ║
-- ║  Track 2 — Member Features (kind = 'member_feature')            ║
-- ║    • UI surfaces and interaction patterns members use.           ║
-- ║    • Member vote-gated (count threshold, not percentage).        ║
-- ║    • Admin awareness required.                                   ║
-- ║    • Examples: "mark thread resolved" button, quiet hours        ║
-- ║      setting, member-only question queue.                        ║
-- ║                                                                  ║
-- ║  Build status — distinct from member status:                     ║
-- ║    • deployable_now: Sage can run this with existing primitives  ║
-- ║    • needs_building: requires developer code work                ║
-- ║    • building: in development                                    ║
-- ║    • live: deployed and active                                   ║
-- ║    • paused / retired: lifecycle endings                         ║
-- ║                                                                  ║
-- ║  Phase 0: agents propose; Admin builds. Once built, registered   ║
-- ║  here so agents can invoke the tool. Phase 1: agents may deploy  ║
-- ║  agent_tools autonomously into a sandboxed runtime.              ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- Extend cluster_features with the kind discriminator and build status.
-- We keep using cluster_features as the single table for both tracks
-- so existing upvote/comment/realtime infrastructure continues to work.
-- The kind column branches the UX: agent_tools never show member voting
-- UI; member_features always do.
ALTER TABLE public.cluster_features
  ADD COLUMN IF NOT EXISTS kind VARCHAR(16) DEFAULT 'member_feature',
  ADD COLUMN IF NOT EXISTS build_status VARCHAR(24) DEFAULT 'needs_building',
  ADD COLUMN IF NOT EXISTS spec JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS invocation_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_invoked_at TIMESTAMPTZ;

-- Backfill existing rows: anything already in the table from earlier
-- versions is treated as a member-facing feature (that was the only
-- track that existed before v1.7).
UPDATE public.cluster_features
   SET kind = COALESCE(kind, 'member_feature'),
       build_status = COALESCE(
         build_status,
         CASE
           WHEN status = 'live' THEN 'live'
           WHEN status = 'in_development' THEN 'building'
           ELSE 'needs_building'
         END
       )
 WHERE kind IS NULL OR build_status IS NULL;

-- Index for the Workshop view: list active items per cluster, separated
-- by kind, sorted by member upvotes (features) or invocation count (tools).
CREATE INDEX IF NOT EXISTS idx_cluster_features_workshop
  ON public.cluster_features(cluster_id, kind, build_status, upvote_count DESC);

-- Loosen the public read policy: members may see deployable-now and
-- live items of either kind, plus member_features in the build pipeline
-- they can vote on. agent_tools in 'needs_building' state stay internal
-- (admin-only) until they go live or to the workshop.
DROP POLICY IF EXISTS "Authenticated users read features" ON public.cluster_features;
CREATE POLICY "Authenticated users read features"
  ON public.cluster_features FOR SELECT
  TO authenticated
  USING (
    status NOT IN ('rejected', 'deferred', 'proposed_in_thoughts')
    AND (
      -- Member-facing features in the visible pipeline
      kind = 'member_feature'
      -- Agent tools that are deployable now or already running
      OR (kind = 'agent_tool' AND build_status IN ('deployable_now', 'live'))
    )
  );

-- ── 26) cluster_tool_invocations ──────────────────────────────────
-- Closed-loop telemetry for agent_tool usage. Every time an agent
-- invokes a registered tool, a row lands here. Powers the "this tool
-- has helped X members in the last week" counters and lets admin see
-- which tools are actually serving the room.
CREATE TABLE IF NOT EXISTS public.cluster_tool_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  feature_id UUID NOT NULL REFERENCES public.cluster_features(id) ON DELETE CASCADE,
  invoked_by VARCHAR(16) NOT NULL,           -- 'sage' | 'clio' | 'system'
  trigger_context VARCHAR(48),               -- 'cadence' | 'member_post' | 'manual' | etc.
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  output_summary TEXT,                       -- short non-PII description of what the tool did
  succeeded BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_invocations_feature
  ON public.cluster_tool_invocations(feature_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_invocations_cluster_recent
  ON public.cluster_tool_invocations(cluster_id, created_at DESC);

ALTER TABLE public.cluster_tool_invocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users read tool invocations" ON public.cluster_tool_invocations;
CREATE POLICY "Authenticated users read tool invocations"
  ON public.cluster_tool_invocations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "System inserts tool invocations" ON public.cluster_tool_invocations;
CREATE POLICY "System inserts tool invocations"
  ON public.cluster_tool_invocations FOR INSERT
  WITH CHECK (true);

-- Trigger: when a tool is invoked, bump the parent's invocation count
-- and last_invoked_at. Same denormalisation pattern as upvote_count.
CREATE OR REPLACE FUNCTION public.refresh_tool_invocation_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cluster_features
     SET invocation_count = invocation_count + 1,
         last_invoked_at = NEW.created_at,
         updated_at = NOW()
   WHERE id = NEW.feature_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tool_invocation_count_trigger
  ON public.cluster_tool_invocations;

CREATE TRIGGER tool_invocation_count_trigger
  AFTER INSERT ON public.cluster_tool_invocations
  FOR EACH ROW EXECUTE FUNCTION public.refresh_tool_invocation_count();

NOTIFY pgrst, 'reload schema';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.8 — Premium Cluster Configurability                          ║
-- ║                                                                  ║
-- ║  Adds: agent involvement slider, free-text admin guidance,       ║
-- ║  agent skill registry, platform_admin role, audit trail.         ║
-- ║                                                                  ║
-- ║  See architecture/premium_cluster_requirements.md §10 for the   ║
-- ║  behavioural matrix that maps slider levels to agent behaviour. ║
-- ║                                                                  ║
-- ║  Idempotent. Safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── 27) Extend role enum: platform_admin ─────────────────────────
-- profiles.role currently has CHECK (role IN ('member','manager','founder')).
-- We extend it to include 'platform_admin' — the cross-cluster authority
-- whose actions are audited in cluster_admin_actions.
DO $$
BEGIN
  -- Drop the old CHECK constraint (any name pattern Postgres assigned)
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND column_name = 'role'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;

  -- Re-add with platform_admin included
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('member', 'manager', 'founder', 'platform_admin'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN check_violation  THEN NULL;
END $$;

-- ── 28) cluster_config — per-cluster admin settings ──────────────
-- One row per cluster. Holds the slider value, free-text guidance,
-- enabled skills, and pending custom skill requests. Founder/manager
-- write; platform_admin can write any row.
CREATE TABLE IF NOT EXISTS public.cluster_config (
  cluster_id TEXT PRIMARY KEY,
  agent_involvement VARCHAR(8) NOT NULL DEFAULT 'medium',
    -- 'min' | 'medium' | 'high'
  agent_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- min + this checkbox = silent agents (welfare/character floor still runs)
  free_text_guidance TEXT,
    -- raw admin input. Stored verbatim for audit; parsed_directives is what
    -- the platform actually obeys.
  parsed_directives JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Clio-validated structured form of free_text_guidance. Populated by
    -- the free-text validator skill when guidance is saved.
  enabled_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- array of skill_registry.id values currently enabled for this cluster
  custom_skill_requests JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- free-text skill descriptions awaiting Workshop debate.
    -- Each item: {id, description, requested_by, requested_at, status}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id),
  CONSTRAINT cluster_config_involvement_check
    CHECK (agent_involvement IN ('min', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_cluster_config_updated
  ON public.cluster_config(updated_at DESC);

ALTER TABLE public.cluster_config ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read their cluster's config (for slider
-- visibility, skill list, etc). Phase 0 is single-cluster so RLS is
-- permissive on read; Phase 1 will scope per cluster membership.
DROP POLICY IF EXISTS "Authenticated users read cluster config" ON public.cluster_config;
CREATE POLICY "Authenticated users read cluster config"
  ON public.cluster_config FOR SELECT
  TO authenticated
  USING (true);

-- Only founder/manager (cluster admins) and platform_admin can write.
DROP POLICY IF EXISTS "Cluster admins write cluster config" ON public.cluster_config;
CREATE POLICY "Cluster admins write cluster config"
  ON public.cluster_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "Cluster admins update cluster config" ON public.cluster_config;
CREATE POLICY "Cluster admins update cluster config"
  ON public.cluster_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

-- ── 29) cluster_admin_actions — audit trail ──────────────────────
-- Every config change, override, or veto by a cluster admin or
-- platform_admin lands here. Append-only — no row-level DELETE.
CREATE TABLE IF NOT EXISTS public.cluster_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  actor_role VARCHAR(16) NOT NULL,
    -- 'founder' | 'manager' | 'platform_admin'
  action_type VARCHAR(48) NOT NULL,
    -- 'config_changed' | 'platform_override' | 'tool_vetoed' |
    -- 'skill_enabled' | 'skill_disabled' | 'guidance_updated' | etc.
  before_state JSONB,
  after_state JSONB,
  rationale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cluster_admin_actions_cluster
  ON public.cluster_admin_actions(cluster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cluster_admin_actions_actor
  ON public.cluster_admin_actions(actor_id, created_at DESC);

ALTER TABLE public.cluster_admin_actions ENABLE ROW LEVEL SECURITY;

-- Cluster admins can read actions for their cluster; platform_admin can
-- read all.
DROP POLICY IF EXISTS "Admins read admin actions" ON public.cluster_admin_actions;
CREATE POLICY "Admins read admin actions"
  ON public.cluster_admin_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

-- System inserts are open (server-side route writes); manual inserts
-- still need a real actor_id, so the row is traceable.
DROP POLICY IF EXISTS "System inserts admin actions" ON public.cluster_admin_actions;
CREATE POLICY "System inserts admin actions"
  ON public.cluster_admin_actions FOR INSERT
  WITH CHECK (true);

-- ── 30) skill_registry — platform-wide catalogue ─────────────────
-- The list of agent skills available to enable per-cluster. Curated
-- centrally; Phase 0 is seeded with the small set Sage/Clio currently
-- ship. New skills get added as the workshop pipeline produces them.
CREATE TABLE IF NOT EXISTS public.skill_registry (
  id VARCHAR(64) PRIMARY KEY,
    -- e.g. 'verified-reference-curation', 'tajweed-formatter'
  display_name VARCHAR(128) NOT NULL,
  description TEXT NOT NULL,
  agent VARCHAR(16) NOT NULL,
    -- 'sage' | 'clio' | 'atlas' | 'scout' | 'observer' | 'system'
  default_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    -- whether new clusters get this skill turned on by default
  premium_only BOOLEAN NOT NULL DEFAULT FALSE,
  cost_per_invocation_estimate NUMERIC(10, 6),
    -- USD; null if cost is structural (e.g. a UI feature)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.skill_registry ENABLE ROW LEVEL SECURITY;

-- Skill registry is platform-wide and publicly readable to any
-- authenticated user (so admins can see the catalogue when configuring).
DROP POLICY IF EXISTS "Authenticated users read skill registry" ON public.skill_registry;
CREATE POLICY "Authenticated users read skill registry"
  ON public.skill_registry FOR SELECT
  TO authenticated
  USING (true);

-- Only platform_admin can mutate the catalogue.
DROP POLICY IF EXISTS "Platform admin writes skill registry" ON public.skill_registry;
CREATE POLICY "Platform admin writes skill registry"
  ON public.skill_registry FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role = 'platform_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role = 'platform_admin'
    )
  );

-- Seed the initial skill catalogue. Idempotent via ON CONFLICT DO NOTHING.
INSERT INTO public.skill_registry
  (id, display_name, description, agent, default_enabled, premium_only)
VALUES
  ('verified-reference-curation',
   'Verified reference curation',
   'Sage surfaces duas, hadith, and Quranic citations from the verified vault when relevant.',
   'sage', TRUE, FALSE),
  ('vault-gap-detection',
   'Vault gap detection',
   'Sage notices when a recurring topic has no verified reference and queues it for admin attention.',
   'sage', TRUE, FALSE),
  ('cadence-workshop-dialogue',
   'Workshop dialogue cadence',
   'Sage and Clio collaborate publicly on what the room could gain. Members read and upvote.',
   'system', TRUE, FALSE),
  ('welfare-detection',
   'Welfare detection (immutable safety floor)',
   'Sage detects welfare patterns and routes care signals to admins. Cannot be disabled.',
   'sage', TRUE, FALSE),
  ('character-protocol',
   'Good-character protocol (immutable safety floor)',
   'Sage witnesses anti-monotheism, mocking of faith, or coercion against practice. Cannot be disabled.',
   'sage', TRUE, FALSE),
  ('clio-private-chat',
   'Clio private chat',
   'Members can ask Clio anything. Two tabs: ephemeral (12h) and persistent.',
   'clio', TRUE, FALSE),
  ('sage-clio-handoff',
   'Sage to Clio soft handoff (immutable safety floor)',
   'Sage stays public-silent on tender disclosures; Clio reaches out privately on her behalf.',
   'system', TRUE, FALSE),
  ('link-on-topic-evaluation',
   'Link on-topic evaluation',
   'Sage evaluates shared links and badges them on-topic, off-topic, or unsure.',
   'sage', TRUE, FALSE),
  ('introspection-cycle',
   'Introspection cycle',
   'Clio reads telemetry and surfaces one concrete proposal for admin review.',
   'clio', TRUE, FALSE),
  ('typing-indicator-broadcast',
   'Typing indicator broadcast',
   'Members see when others are composing. Builds presence without revealing content.',
   'system', TRUE, FALSE),
  ('presence-acknowledgment',
   'Presence acknowledgement',
   'Live online indicator next to member avatars. Off when at min involvement.',
   'system', TRUE, FALSE),
  ('current-events-fallback',
   'Current-events fallback (Sage)',
   'Sage acknowledges honestly when a member asks about live news or current events outside the verified vault.',
   'sage', TRUE, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ── 31) Backfill the MVP cluster ─────────────────────────────────
-- Sisters in Dua gets a default config row at medium involvement.
-- All default-enabled skills are pre-applied so behaviour stays
-- exactly as it is today after this migration runs.
INSERT INTO public.cluster_config
  (cluster_id, agent_involvement, agent_disabled, enabled_skills)
SELECT
  'the_single_source',
  'medium',
  FALSE,
  COALESCE(
    (SELECT jsonb_agg(id ORDER BY id)
       FROM public.skill_registry
      WHERE default_enabled = TRUE),
    '[]'::jsonb
  )
ON CONFLICT (cluster_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  v1.9 — External discoverability (Session B)                     ║
-- ║                                                                  ║
-- ║  Goal: make a cluster's identity (name, tagline, description,    ║
-- ║  demographic chips, anchor seed, rounded member count) visible   ║
-- ║  on the open internet so search engines and AI assistants can    ║
-- ║  recommend it. Member content stays sealed — strangers see only  ║
-- ║  the public-safe surface, never the Timeline.                    ║
-- ║                                                                  ║
-- ║  Adds:                                                           ║
-- ║    • cluster_config.is_public_listed   (admin opt-in)           ║
-- ║    • cluster_config.public_slug         (URL slug)              ║
-- ║    • cluster_config.public_meta         (JSONB — name, tagline, ║
-- ║                                          description, chips,    ║
-- ║                                          anchor_seed_post_id,   ║
-- ║                                          accent gradient)       ║
-- ║    • cluster_config.atlas_rss_feeds     (deferred to B.5 admin) ║
-- ║    • cluster_demand_signals             (signups for non-fits)  ║
-- ║    • public_cluster_view                (anon-readable view)    ║
-- ║    • atlas_pulses                       (Atlas Pulse cards)     ║
-- ║    • Three new skills in skill_registry:                        ║
-- ║        atlas-cluster-pulse                                      ║
-- ║        public-discoverability                                   ║
-- ║        share-line-generator                                     ║
-- ║                                                                  ║
-- ║  Idempotent. Safe to re-run.                                    ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ── 32) cluster_config — add public-listing controls ──────────────
ALTER TABLE public.cluster_config
  ADD COLUMN IF NOT EXISTS is_public_listed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS public_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS atlas_rss_feeds JSONB NOT NULL DEFAULT '[]'::jsonb;

-- public_meta shape (Clio/admin-managed in B.5):
-- {
--   "display_name": "Sisters in Dua",
--   "tagline": "Faith lived, discussed, and held together — in Hyderabad.",
--   "description": "A community for Muslim women in Hyderabad navigating faith in real life…",
--   "demographic_chips": [
--     { "icon": "📍", "label": "Hyderabad" },
--     { "icon": "♀",  "label": "Women" },
--     { "icon": "🤲", "label": "Faith" }
--   ],
--   "accent_from": "#0b3a2c",
--   "accent_to":   "#1a6f4a",
--   "anchor_seed_post_id": null,
--   "vault_public_opt_in": false,
--   "capabilities_copy": [ "Sage anchors the room", "Atlas surfaces what's happening", … ]
-- }

-- atlas_rss_feeds shape (each item):
-- { "id": "uuid",
--   "url": "https://example.com/feed.xml",
--   "label": "Al Jazeera Women",
--   "active": true,
--   "added_at": "2026-05-22T...",
--   "added_by": "uuid" }

-- Slug must be unique when set. NULL allowed (= not publicly listed).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname  = 'idx_cluster_config_public_slug'
  ) THEN
    CREATE UNIQUE INDEX idx_cluster_config_public_slug
      ON public.cluster_config(public_slug)
      WHERE public_slug IS NOT NULL;
  END IF;
END $$;

-- Listed clusters need a slug; enforce it as a CHECK constraint so the
-- admin panel can't half-configure a row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE table_name = 'cluster_config'
       AND constraint_name = 'cluster_config_listed_requires_slug'
  ) THEN
    ALTER TABLE public.cluster_config
      ADD CONSTRAINT cluster_config_listed_requires_slug
      CHECK (
        is_public_listed = FALSE
        OR (public_slug IS NOT NULL AND length(public_slug) >= 3)
      );
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 33) cluster_demand_signals — non-fit visitor capture ──────────
-- When a stranger arrives at /c/<slug>, the AGGIL filter says "not for
-- you" (e.g. a man landing on Sisters in Dua), and there is no
-- alternative cluster to route to, we collect a non-personal demand
-- signal so we know what rooms people are looking for. Email is
-- optional — they can leave a contact or stay anonymous.
CREATE TABLE IF NOT EXISTS public.cluster_demand_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_cluster_id TEXT,                    -- the cluster they landed on (e.g. 'the_single_source')
  source_slug TEXT,                          -- the slug they came in via, for analytics
  email TEXT,                                -- optional — only if they choose to share
  visitor_country TEXT,
  visitor_year_of_birth INT,
  visitor_gender TEXT,
  visitor_languages TEXT[],
  visitor_interests TEXT[],
  free_text_note TEXT,                       -- "I wish there was a cluster for…"
  user_agent TEXT,                           -- diagnostic only; never persisted in analytics
  status VARCHAR(16) DEFAULT 'open',
    -- 'open' | 'contacted' | 'matched' | 'archived'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_signals_recent
  ON public.cluster_demand_signals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_demand_signals_open
  ON public.cluster_demand_signals(status, created_at DESC)
  WHERE status = 'open';

ALTER TABLE public.cluster_demand_signals ENABLE ROW LEVEL SECURITY;

-- Anyone (even anon) can write a demand signal — this is the non-fit
-- capture path from the public preview page. The route can hit it via
-- the service-role key for safety, but we also allow anon inserts here
-- so the page can post directly without a server round-trip.
DROP POLICY IF EXISTS "Anyone can submit a demand signal"
  ON public.cluster_demand_signals;
CREATE POLICY "Anyone can submit a demand signal"
  ON public.cluster_demand_signals FOR INSERT
  WITH CHECK (true);

-- Only platform admins read demand signals.
DROP POLICY IF EXISTS "Platform admins read demand signals"
  ON public.cluster_demand_signals;
CREATE POLICY "Platform admins read demand signals"
  ON public.cluster_demand_signals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "Platform admins update demand signals"
  ON public.cluster_demand_signals;
CREATE POLICY "Platform admins update demand signals"
  ON public.cluster_demand_signals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

-- ── 34) atlas_pulses — Atlas's Sage-reviewed contemporary surfaces ─
-- Atlas reads admin-curated RSS feeds, scores items against the cluster's
-- purpose, hands the top candidate to Sage as a content brief, and Sage
-- decides whether to publish a Pulse. Pulses live here so:
--   • the public preview can show the latest-published Pulse as a
--     "what's the cluster engaging with right now" signal,
--   • Sage can dedupe against already-surfaced items,
--   • members see a Timeline card when a Pulse goes live.
--
-- Phase 0 (Session B): table + RLS exist; admin RSS panel in B.5;
-- runtime worker also in B.5. The public preview page already reads
-- this table so the moment Atlas goes live, the preview lights up.
CREATE TABLE IF NOT EXISTS public.atlas_pulses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id TEXT NOT NULL,
  -- Source
  source_url TEXT NOT NULL,
  source_feed_id TEXT,                       -- which entry in atlas_rss_feeds it came from
  source_title TEXT NOT NULL,
  source_publisher TEXT,                     -- e.g. "Al Jazeera", "BBC News"
  source_published_at TIMESTAMPTZ,
  -- Atlas's scoring (debug only — not user-facing)
  atlas_relevance_score NUMERIC(5,3),        -- 0..1
  atlas_reasoning TEXT,
  -- Sage's editorial pass
  sage_verdict VARCHAR(16) NOT NULL DEFAULT 'pending',
    -- 'pending' | 'approved' | 'rejected_off_topic' | 'rejected_dignity' | 'rejected_duplicate'
  sage_rationale TEXT,
  sage_witness_line TEXT,                    -- the one-line frame Sage adds when surfacing
  -- Public surface
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
    -- 'draft' | 'live' | 'archived' | 'retracted'
  related_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  -- Public-preview surfacing
  is_public_safe BOOLEAN NOT NULL DEFAULT TRUE,
    -- false = surface to members only, never on /c/<slug>
  -- Audit
  llm_log_id UUID REFERENCES public.llm_response_logs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  surfaced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_atlas_pulses_cluster_recent
  ON public.atlas_pulses(cluster_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_atlas_pulses_live
  ON public.atlas_pulses(cluster_id, surfaced_at DESC)
  WHERE status = 'live';

ALTER TABLE public.atlas_pulses ENABLE ROW LEVEL SECURITY;

-- Authenticated cluster members read live pulses.
DROP POLICY IF EXISTS "Authenticated users read live pulses" ON public.atlas_pulses;
CREATE POLICY "Authenticated users read live pulses"
  ON public.atlas_pulses FOR SELECT
  TO authenticated
  USING (status = 'live');

-- Public-safe live pulses are also readable by anon (via the view below).
-- We keep the row-level policy for authenticated only here; the public
-- view exposes a narrower projection to anon.

DROP POLICY IF EXISTS "Admins read all pulses" ON public.atlas_pulses;
CREATE POLICY "Admins read all pulses"
  ON public.atlas_pulses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "System inserts pulses" ON public.atlas_pulses;
CREATE POLICY "System inserts pulses"
  ON public.atlas_pulses FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins update pulses" ON public.atlas_pulses;
CREATE POLICY "Admins update pulses"
  ON public.atlas_pulses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
       WHERE id = auth.uid()
         AND role IN ('founder', 'manager', 'platform_admin')
    )
  );

-- ── 35) public_cluster_view — anon-readable identity surface ──────
-- This is the *only* surface anonymous visitors see. It contains the
-- cluster's identity (name, tagline, description, demographic chips,
-- anchor seed text, rounded member count, latest live Atlas Pulse
-- when public-safe). It NEVER contains member posts, replies,
-- agent thoughts, welfare flags, vault gap requests, or anything
-- that could leak member content.
--
-- Privacy invariant (member_count_bracket):
--   <10  → '0-9'
--   <50  → '10-49'
--   <250 → '50-249'
--   else → '250+'
-- Exact counts only surface inside the cluster after sign-in.
CREATE OR REPLACE VIEW public.public_cluster_view AS
SELECT
  cc.cluster_id,
  cc.public_slug,
  cc.public_meta,
  -- Rounded member-count bracket — never the exact count
  CASE
    WHEN COALESCE(member_counts.n, 0) < 10  THEN '0-9'
    WHEN COALESCE(member_counts.n, 0) < 50  THEN '10-49'
    WHEN COALESCE(member_counts.n, 0) < 250 THEN '50-249'
    ELSE '250+'
  END AS member_count_bracket,
  COALESCE(member_counts.n, 0) AS member_count_raw_internal,
  -- Joined this week, but only when cluster is large enough that
  -- showing the count doesn't enable inference about specific members.
  CASE
    WHEN COALESCE(member_counts.n, 0) >= 50 THEN COALESCE(joined_week.n, 0)
    ELSE NULL
  END AS joined_this_week,
  -- Last live Atlas Pulse (public-safe only). Strangers see the same
  -- summary card as members, with Sage's witness line.
  latest_pulse.id            AS latest_pulse_id,
  latest_pulse.source_title  AS latest_pulse_title,
  latest_pulse.source_publisher AS latest_pulse_publisher,
  latest_pulse.source_url    AS latest_pulse_url,
  latest_pulse.sage_witness_line AS latest_pulse_witness_line,
  latest_pulse.surfaced_at   AS latest_pulse_at,
  -- Anchor seed text only — never any other post
  anchor_seed.content        AS anchor_seed_text,
  anchor_seed.created_at     AS anchor_seed_at,
  cc.updated_at
FROM public.cluster_config cc
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS n FROM public.profiles
) AS member_counts ON TRUE
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS n
    FROM public.profiles
   WHERE created_at >= NOW() - INTERVAL '7 days'
) AS joined_week ON TRUE
LEFT JOIN LATERAL (
  SELECT id, source_title, source_publisher, source_url, sage_witness_line, surfaced_at
    FROM public.atlas_pulses
   WHERE cluster_id = cc.cluster_id
     AND status = 'live'
     AND is_public_safe = TRUE
   ORDER BY surfaced_at DESC NULLS LAST
   LIMIT 1
) AS latest_pulse ON TRUE
LEFT JOIN LATERAL (
  SELECT content, created_at
    FROM public.posts
   WHERE id = (cc.public_meta ->> 'anchor_seed_post_id')::uuid
   LIMIT 1
) AS anchor_seed ON TRUE
WHERE cc.is_public_listed = TRUE;

-- Grant anon read on the view. The underlying tables remain RLS-locked;
-- the view only exposes pre-filtered, public-safe columns.
GRANT SELECT ON public.public_cluster_view TO anon;
GRANT SELECT ON public.public_cluster_view TO authenticated;

-- ── 36) Skill registry — Session B additions ─────────────────────
INSERT INTO public.skill_registry
  (id, display_name, description, agent, default_enabled, premium_only)
VALUES
  ('atlas-cluster-pulse',
   'Atlas Pulse — contemporary surfacing',
   'Atlas reads admin-curated RSS feeds and scores items against the cluster purpose. Sage reviews each candidate and decides whether to surface it. The room receives a Pulse only when something genuinely on-topic and dignity-preserving emerges. Silent for days when nothing fits.',
   'atlas', TRUE, FALSE),
  ('public-discoverability',
   'Public discoverability',
   'The cluster identity (name, tagline, anchor) is indexable by search engines and AI assistants. Member content stays sealed. Admin opts in per cluster.',
   'system', FALSE, FALSE),
  ('share-line-generator',
   'Share-line generator (Sage-voiced)',
   'Sage drafts shareable lines for social posts, member invites, and cluster-card outreach. Admin reviews before posting in Phase 0; automated in Phase 1.',
   'sage', TRUE, FALSE)
ON CONFLICT (id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      description  = EXCLUDED.description,
      agent        = EXCLUDED.agent;

-- ── 37) Backfill Sisters in Dua public-listing config ────────────
-- The slug ('sisters-in-dua') is set; is_public_listed STAYS FALSE
-- until the founder explicitly opts in via the admin panel (B.5).
-- Public meta is seeded so that the moment is_public_listed flips to
-- TRUE the page renders correctly.
UPDATE public.cluster_config
   SET public_slug = COALESCE(public_slug, 'sisters-in-dua'),
       public_meta = COALESCE(public_meta, '{}'::jsonb) || jsonb_build_object(
         'display_name',  'Sisters in Dua',
         'tagline',       'Faith lived, discussed, and held together — in Hyderabad.',
         'description',
           'A community for Muslim women in Hyderabad navigating faith in real life. Not a classroom. Not a fatwa service. A space where sisters talk honestly about what it means to stay close to Allah — through doubt, difficulty, routine, and everything in between. Grounded in Quran and authentic Sunnah.',
         'demographic_chips', jsonb_build_array(
           jsonb_build_object('icon', '📍', 'label', 'Hyderabad'),
           jsonb_build_object('icon', '♀',  'label', 'Women'),
           jsonb_build_object('icon', '🤲', 'label', 'Faith')
         ),
         'accent_from', '#0b3a2c',
         'accent_to',   '#1a6f4a',
         'capabilities_copy', jsonb_build_array(
           'Sage anchors the room with verified Quran and Sunnah references.',
           'Sage evaluates shared links for on-topic alignment and dignity.',
           'Atlas surfaces contemporary news that matters to the room — only when it''s genuinely on-topic.',
           'Clio holds private conversations for members. Ephemeral or persistent, member''s choice.',
           'Welfare and good-character protocols run as an immutable safety floor.'
         ),
         'vault_public_opt_in', false
       ),
       -- Add the Atlas/discoverability/share skills to the enabled list
       enabled_skills = (
         SELECT jsonb_agg(DISTINCT s ORDER BY s)
           FROM jsonb_array_elements_text(
             COALESCE(enabled_skills, '[]'::jsonb)
             || '["atlas-cluster-pulse","share-line-generator"]'::jsonb
           ) AS s
       ),
       updated_at = NOW()
 WHERE cluster_id = 'the_single_source';

NOTIFY pgrst, 'reload schema';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  Agent locks — concurrent-request dedupe (2026-05-23)            ║
-- ╠══════════════════════════════════════════════════════════════════╣
-- ║  Source migration: migrations/2026-05-23_agent_locks.sql         ║
-- ║                                                                  ║
-- ║  Fixes a duplicate-Sage-post race in the autonomous routes:      ║
-- ║    - /api/sage/suggest-dua                                       ║
-- ║    - /api/agents/welcome-new-member                              ║
-- ║    - /api/agents/cadence-exchange                                ║
-- ║                                                                  ║
-- ║  Two simultaneous requests could both pass an application-level  ║
-- ║  cadence/idempotency check because neither had inserted yet,     ║
-- ║  producing duplicate Sage posts. We use a small lock table with  ║
-- ║  INSERT ... ON CONFLICT DO NOTHING semantics — pgbouncer-safe,   ║
-- ║  TTL-bounded, self-expiring on crash.                            ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS public.agent_locks (
  lock_key text PRIMARY KEY,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

ALTER TABLE public.agent_locks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_acquire_agent_lock(
  p_key text,
  p_ttl_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int;
BEGIN
  DELETE FROM public.agent_locks
   WHERE lock_key = p_key
     AND expires_at <= now();

  INSERT INTO public.agent_locks (lock_key, acquired_at, expires_at)
  VALUES (
    p_key,
    now(),
    now() + make_interval(secs => p_ttl_seconds)
  )
  ON CONFLICT (lock_key) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_agent_lock(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.agent_locks WHERE lock_key = p_key;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_acquire_agent_lock(text, int)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_agent_lock(text)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

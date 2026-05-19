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

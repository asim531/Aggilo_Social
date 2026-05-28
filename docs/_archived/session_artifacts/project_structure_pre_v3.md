# Aggilo Social - Project Structure & Context

## 1. Project Context
**Project Name:** Aggilo Social
**Founder:** Azim (sole founder, conviction-driven, tends to over-plan before shipping)
**Ideal User:** Rajvir (22yo introvert UX designer)

**The Vision:** 
Aggilo Social is an AI-orchestrated community platform built to facilitate genuine, deep human connection rather than optimizing for superficial engagement metrics. Guided by its foundational "Soul," the platform operates on the premise that "loneliness is not a personal failure, but a condition of separation." It aims to bring people together based on profound, shared resonances.

The platform is powered by a multi-agent architecture (the Yantra architecture), including specialized agents that serve specific roles:
- **Clio:** The ambient presence and onboarding facilitator, treating first encounters with genuine interest.
- **Sage:** The domain expert and community guide, providing knowledge and insight without imposing authority.
- **Scout:** The external observer, scanning signals to understand community needs.
- **Atlas & Observer:** System orchestration and governance agents ensuring the platform operates according to its core values.

The system places a paramount focus on privacy (e.g., using nicknames as the "chosen self") and ethical AI behavior, strictly prohibiting the use of human vulnerability as a metric for engagement.

## 2. Current Implementation: "Sisters in Dua"
While the platform architecture supports various applications, the current operational build is "Sisters in Dua"—a women-only Muslim faith community.

**What it does:**
- Provides a trusted faith space for women to connect.
- Operates a content moat through a founder-curated "Dua Vault" (a collection of supplications).
- Uses the **Clio agent** to handle a welcoming, empathetic onboarding experience for new users.
- Uses the **Sage agent** to assist users within the community by drawing upon the Dua vault for citations, welfare signals, and guidance.
- Uses Supabase for secure authentication (magic links) and database management.

**Current State:**
- The foundation is largely complete, with Next.js configurations, Supabase schema (`schema.sql`), and a seeded Dua vault ready for deployment.
- Magic link authentication flows have been fixed and stabilized.
- Next steps involve deploying to a hosting provider, executing the final database schemas, configuring LLM keys for the agents, and launching to initial users.

## 3. Complete File Structure

```text
+--- .claude
|   +--- skills
|   |   \--- office-hours
|   |       \--- SKILL.md
|   \--- settings.local.json
+--- .gstack
|   \--- browse-audit.jsonl
+--- architecture
|   +--- system_implementation_prompt_part1.md
|   +--- system_implementation_prompt_part2.md
|   +--- system_implementation_prompt_part3.md
|   +--- system_implementation_prompt_part4.md
|   \--- system_implementation_prompt_part5.md
+--- atlas
|   +--- skills
|   |   +--- cluster_pulse
|   |   |   \--- SKILL.md
|   |   \--- README.md
|   +--- AGENTS.md
|   \--- SOUL.md
+--- clio
|   +--- assets
|   |   +--- app
|   |   |   +--- 120
|   |   |   |   \--- .gitkeep
|   |   |   +--- 32
|   |   |   |   \--- .gitkeep
|   |   |   +--- 48
|   |   |   |   \--- .gitkeep
|   |   |   \--- 80
|   |   |       \--- .gitkeep
|   |   +--- source
|   |   |   +--- clips
|   |   |   |   +--- gestures
|   |   |   |   +--- idle
|   |   |   |   |   +--- clio_idle_empathetic_01.mp4
|   |   |   |   |   +--- clio_idle_happy_01.mp4
|   |   |   |   |   +--- clio_idle_resting_01.mp4
|   |   |   |   |   \--- clio_idle_resting_02.mp4
|   |   |   |   \--- transitions
|   |   |   |       +--- clio_transition_resting_to_curious.mp4
|   |   |   |       +--- clio_transition_resting_to_empathetic_01.mp4
|   |   |   |       +--- clio_transition_resting_to_encouraging_01.mp4
|   |   |   |       +--- clio_transition_resting_to_encouraging_02.mp4
|   |   |   |       \--- clio_transition_resting_to_happy.mp4
|   |   |   +--- stills
|   |   |   |   +--- pointing
|   |   |   |   +--- clio_resting_01.png
|   |   |   |   \--- clio_resting_02.png
|   |   |   \--- .gitkeep
|   |   +--- web
|   |   |   \--- .gitkeep
|   |   +--- README.md
|   |   \--- STRUCTURE_REFERENCE.md
|   +--- legacy
|   |   +--- clio_bible_text.txt
|   |   +--- clio_character_bible.docx
|   |   \--- clio_character_bible.html
|   +--- personas
|   |   +--- anchor_36_50
|   |   |   \--- IDENTITY.md
|   |   +--- campus_18_24
|   |   |   \--- IDENTITY.md
|   |   +--- explorer_13_17
|   |   |   \--- IDENTITY.md
|   |   +--- momentum_25_35
|   |   |   \--- IDENTITY.md
|   |   +--- README.md
|   |   \--- _template.md
|   +--- skills
|   |   +--- atlas_orchestration
|   |   |   \--- SKILL.md
|   |   +--- connection_intro
|   |   |   \--- SKILL.md
|   |   +--- sage_coordination
|   |   |   \--- SKILL.md
|   |   +--- sage_introduction
|   |   |   \--- SKILL.md
|   |   \--- waitlist_form
|   |       \--- SKILL.md
|   +--- AGENTS.md
|   +--- clio_animation_prompts_v2.md
|   +--- clio_character_prompt.md
|   +--- clio_image_prompts_v2.md
|   +--- clio_overlay_prompt.md
|   +--- MEMORY.md
|   +--- SOUL.md
|   +--- SOUL_EXTRACT.md
|   \--- USER.md
+--- clusters
|   +--- the_single_source
|   |   +--- CLIO_ONBOARDING.md
|   |   +--- CLUSTER_DESCRIPTION.md
|   |   +--- CLUSTER_TOOLS.md
|   |   \--- SAGE_PERSONA.md
|   \--- CLUSTER_TOOLS_TEMPLATE.md
+--- docs
|   +--- brand
|   |   +--- brand_guidelines.md
|   |   \--- brand_positioning.md
|   +--- _archived
|   |   +--- session_artifacts
|   |   |   +--- implementation_plan.md
|   |   |   +--- memory_audit.md
|   |   |   \--- Optimizing Yantra Agentic Architecture.md
|   |   +--- aggilo-soul.html
|   |   +--- AUTORESEARCH_EXTENDED.md
|   |   +--- CLIO_SAGE_HANDOFF_PROTOCOL.md
|   |   +--- CLUSTER_DESCRIPTION_REFINEMENT.md
|   |   +--- MEMPALACE_ARCHITECTURE.md
|   |   \--- PLATFORM_INTELLIGENCE.md
|   +--- AGGILO_ONBOARDING_PLAYBOOK.md
|   +--- AGGILO_SYSTEM_DIAGRAM.mermaid
|   +--- CLIO_AMBIENT_PROTOCOL.md
|   +--- CLIO_SAGE_HANDOFF.md
|   +--- MASTER_INSTRUCTIONS.md
|   +--- PRE_FLIGHT_AUDIT.md
|   +--- PRODUCTION_FIXES.md
|   +--- SOUL_INJECTION_MAP.md
|   \--- SPEC_ADDENDUM.md
+--- Ideal_user
|   +--- Rajvir
|   |   +--- Clips
|   |   |   \--- Main video.mp4
|   |   +--- audio1468838953.m4a
|   |   +--- recording.conf
|   |   \--- video1468838953.mp4
|   +--- rajvir.txt
|   +--- rajvir_01.txt
|   \--- rajvir_02.txt
+--- launch
|   +--- global_landing
|   |   +--- js
|   |   |   +--- byc-form.js
|   |   |   +--- canvas.js
|   |   |   +--- evangelist-form.js
|   |   |   +--- hero.js
|   |   |   +--- interaction-card.js
|   |   |   +--- pulse-carousel.js
|   |   |   \--- sections.js
|   |   +--- styles
|   |   |   +--- evangelist-form.css
|   |   |   +--- hero.css
|   |   |   +--- interaction-card.css
|   |   |   +--- responsive.css
|   |   |   +--- sections.css
|   |   |   \--- variables.css
|   |   +--- index.html
|   |   \--- submit.php
|   +--- landing
|   |   +--- js
|   |   |   +--- byc-form.js
|   |   |   +--- canvas.js
|   |   |   +--- evangelist-form.js
|   |   |   +--- hero.js
|   |   |   +--- interaction-card.js
|   |   |   +--- pulse-carousel.js
|   |   |   \--- sections.js
|   |   +--- styles
|   |   |   +--- evangelist-form.css
|   |   |   +--- hero.css
|   |   |   +--- interaction-card.css
|   |   |   +--- responsive.css
|   |   |   +--- sections.css
|   |   |   \--- variables.css
|   |   +--- index.html
|   |   \--- submit.php
|   \--- webm
|       +--- resting01_transparent.webm
|       +--- resting02_transparent.webm
|       \--- Resting_to_empathy_transparent.webm
+--- maintenance
|   +--- 2026-05
|   +--- templates
|   |   \--- TOOL_PROPOSAL_TEMPLATE.md
|   \--- README.md
+--- mvp
|   +--- docs
|   +--- public
|   |   \--- characters
|   |       +--- clio.png
|   |       \--- sage.png
|   +--- Sisters In Dua
|   |   +--- vault
|   |   |   +--- Quran Duas
|   |   |   |   +--- ai_studio_code (12).html
|   |   |   |   +--- ai_studio_code (7).html
|   |   |   |   +--- ai_studio_code (8).html
|   |   |   |   \--- old_01.html
|   |   |   +--- 3_astaghfar.html
|   |   |   +--- 5_prophets_istagfar.html
|   |   |   +--- anxiety and sorrow.html
|   |   |   +--- Bedoiun_dua.html
|   |   |   +--- Charachter and Companionship.html
|   |   |   +--- Comprehensive Dhikr_one page.html
|   |   |   +--- Comprehensive _Dhikr.html
|   |   |   +--- Dua for Afiyah.html
|   |   |   +--- dua-alone.html
|   |   |   +--- jami_dua.html
|   |   |   +--- Market_dua.html
|   |   |   +--- Sayyidul istagfar.html
|   |   |   \--- Supplication for Rectifying Affairs.html
|   |   +--- sisters_in_dua_cluster_spec_v3.1.md
|   |   \--- sisters_in_dua_spec_v3_1 (1).html
|   +--- src
|   |   +--- app
|   |   |   +--- api
|   |   |   |   \--- sage
|   |   |   |       \--- route.ts
|   |   |   +--- auth
|   |   |   |   \--- callback
|   |   |   |       \--- route.ts
|   |   |   +--- cluster
|   |   |   |   \--- page.tsx
|   |   |   +--- globals.css
|   |   |   +--- layout.tsx
|   |   |   \--- page.tsx
|   |   +--- components
|   |   |   +--- AuthForm.tsx
|   |   |   +--- ClioWelcome.tsx
|   |   |   +--- ClusterFeed.tsx
|   |   |   +--- ClusterHeader.tsx
|   |   |   +--- ClusterShell.tsx
|   |   |   +--- Navbar.tsx
|   |   |   +--- PostCard.tsx
|   |   |   \--- PostComposer.tsx
|   |   +--- hooks
|   |   |   \--- useRealtimePosts.ts
|   |   +--- lib
|   |   |   +--- sage-prompt.ts
|   |   |   +--- supabase-browser.ts
|   |   |   +--- supabase-server.ts
|   |   |   \--- types.ts
|   |   \--- middleware.ts
|   +--- supabase
|   |   +--- fix.py
|   |   +--- schema-fixed.sql
|   |   +--- schema.sql
|   |   \--- seed-vault.sql
|   +--- .env.example
|   +--- .env.local
|   +--- .gitignore
|   +--- ARCHITECTURE.md
|   +--- CONTINUE.md
|   +--- next-env.d.ts
|   +--- next.config.js
|   +--- next.config.mjs
|   +--- package-lock.json
|   +--- package.json
|   +--- postcss.config.js
|   +--- README.md
|   +--- tailwind.config.ts
|   \--- tsconfig.json
+--- observer
|   \--- AGGILO_OBSERVER_AGENTS.md
+--- PRD
|   +--- 00_prd_index.html
|   +--- 00_prd_index.md
|   +--- 01_registration_onboarding.html
|   +--- 01_registration_onboarding.md
|   +--- 02_cluster_creation.html
|   +--- 02_cluster_creation.md
|   +--- 03_cluster_discovery.html
|   +--- 03_cluster_discovery.md
|   +--- 04_in_cluster_experience.html
|   +--- 04_in_cluster_experience.md
|   +--- 05_premium_ai_matchmaker.html
|   +--- 05_premium_ai_matchmaker.md
|   +--- 06_ai_agents.html
|   +--- 06_ai_agents.md
|   +--- 07_moderation_admin.html
|   +--- 07_moderation_admin.md
|   +--- 08_data_strategy.html
|   +--- 08_data_strategy.md
|   +--- 09_admin_platform.html
|   +--- 09_admin_platform.md
|   +--- 10_atlas_agent.html
|   +--- 10_atlas_agent.md
|   +--- 11_llm_admin_routing.html
|   +--- 11_llm_admin_routing.md
|   +--- 12_premium_clusters.html
|   +--- 12_premium_clusters.md
|   \--- premium_cluster_manager.md
+--- Revised_Screen_Prompts
|   +--- _archived
|   |   \--- mobile_screen_prompts_v1.md
|   \--- mobile_screen_prompts_phase1.md
+--- sage
|   +--- assets
|   |   +--- app
|   |   |   \--- 40
|   |   \--- source
|   |       +--- clips
|   |       \--- stills
|   |           \--- sage.png
|   +--- skills
|   |   +--- cluster_description_refinement
|   |   |   \--- SKILL.md
|   |   \--- scripture_current_affairs
|   |       \--- SKILL.md
|   +--- AGENTS.md
|   +--- sage_animation_prompts_v1.md
|   +--- sage_character_prompt.md
|   +--- sage_image_prompts.md
|   +--- SAGE_SKILLS.md
|   \--- SOUL.md
+--- scout
|   +--- AGENTS.md
|   \--- SOUL.md
+--- yantra
|   +--- guides
|   |   +--- agentic_workflow.html
|   |   +--- architecture_reference.html
|   |   \--- yantra_guide.html
|   +--- README.md
|   +--- routing_table.json
|   \--- YANTRA_BRIDGE_SPEC.md
+--- AGGILO_PLATFORM_RULES.md
+--- AGGILO_SOUL.md
+--- asset_persona_review.md
+--- CLAUDE.md
+--- package-lock.json
+--- redundancy_audit.md
\--- walkthrough.md
```
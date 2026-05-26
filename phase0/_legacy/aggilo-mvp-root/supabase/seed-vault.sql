-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  DUA VAULT — Seed Data (extracted from vault HTML files)         ║
-- ║  Run AFTER schema.sql in the Supabase SQL Editor                ║
-- ╚══════════════════════════════════════════════════════════════════╝

INSERT INTO public.dua_vault (
  arabic_text, transliteration, translation, source_type,
  source_collection, source_hadith_number, source_chapter_verse,
  hadith_grade, occasion, thematic_tags, is_quranic,
  length_classification, verified_by_founder, title, notes
) VALUES

-- 1. Du'a for the Soul That Feels Alone (Ya Hayyu Ya Qayyum)
(
  'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
  'Yā Ḥayyu yā Qayyūm, bi-raḥmatika astaghīth, aṣliḥ lī sha''nī kullahu, wa lā takilnī ilā nafsī ṭarfata ''ayn',
  'O Ever-Living, O Sustainer of all existence — by Your mercy I seek relief. Rectify all my affairs for me, and do not leave me to myself even for the blink of an eye.',
  'hadith',
  'Jami'' at-Tirmidhi',
  3524,
  NULL,
  'hasan',
  ARRAY['general', 'morning', 'evening'],
  ARRAY['anxiety', 'hardship', 'reliance_on_allah', 'faith_renewal', 'sabr'],
  false,
  'medium',
  true,
  'Du''a for the Soul That Feels Alone',
  'Narrated by Anas ibn Malik. The Prophet ﷺ would say this whenever distress befell him. Graded Hasan by al-Albani, Sahih by al-Mundhiri.'
),

-- 2. Al-Dua Al-Jami' (The Comprehensive Supplication) - Part 1
(
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنَ الْخَيْرِ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ وَأَعُوذُ بِكَ مِنَ الشَّرِّ كُلِّهِ عَاجِلِهِ وَآجِلِهِ مَا عَلِمْتُ مِنْهُ وَمَا لَمْ أَعْلَمْ',
  'Allahumma inni as''aluka minal-khayri kullihi, ''ajilihi wa ajilihi, ma ''alimtu minhu wa ma lam a''lam. Wa a''udhu bika minash-sharri kullihi, ''ajilihi wa ajilihi, ma ''alimtu minhu wa ma lam a''lam.',
  'O Allah, I ask You for all that is good, in this world and in the Hereafter, what I know of it and what I do not know. And I seek refuge with You from all evil, in this world and in the Hereafter, what I know of it and what I do not know.',
  'hadith',
  'Sunan Ibn Majah',
  3846,
  NULL,
  'sahih',
  ARRAY['general', 'morning', 'evening'],
  ARRAY['guidance_seeking', 'reliance_on_allah', 'sabr', 'shukr'],
  false,
  'long',
  true,
  'Al-Dua Al-Jami'' (The Comprehensive Supplication)',
  'Taught by Prophet Muhammad ﷺ to Aisha (RA). He said: "O Aisha! Should I not teach you some words which are comprehensive and substantial?"'
),

-- 3. Al-Dua Al-Jami' Part 2 - Asking for Paradise
(
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ وَأَعُوذُ بِكَ مِنَ النَّارِ وَمَا قَرَّبَ إِلَيْهَا مِنْ قَوْلٍ أَوْ عَمَلٍ وَأَسْأَلُكَ أَنْ تَجْعَلَ كُلَّ قَضَاءٍ قَضَيْتَهُ لِي خَيْرًا',
  'Allahumma inni as''alukul-jannata wa ma qarraba ilayha min qawlin aw ''amal, wa a''udhu bika minan-nari wa ma qarraba ilayha min qawlin aw ''amal, wa as''aluka an taj''ala kulla qada''in qadaytahu li khayra.',
  'O Allah, I ask You for Paradise and whatever brings me closer to it in word and deed, and I seek refuge with You from the Fire and whatever brings me closer to it in word and deed, and I ask You to make every decree You decree for me good.',
  'hadith',
  'Sunan Ibn Majah',
  3846,
  NULL,
  'sahih',
  ARRAY['general'],
  ARRAY['guidance_seeking', 'tawakkul', 'sabr', 'reliance_on_allah'],
  false,
  'long',
  true,
  'Supplication for Paradise and Good Decree',
  'Final part of the comprehensive supplication taught to Aisha (RA).'
),

-- 4. Sayyidul Istighfar (Master of Seeking Forgiveness)
(
  'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
  'Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana ''abduka, wa ana ''ala ''ahdika wa wa''dika mastata''tu. A''udhu bika min sharri ma sana''tu. Abu''u laka bi ni''matika ''alayya, wa abu''u laka bi dhanbi. Faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.',
  'O Allah, You are my Lord, there is no god but You. You created me and I am Your servant. I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me — for none forgives sins except You.',
  'hadith',
  'Sahih al-Bukhari',
  6306,
  NULL,
  'sahih',
  ARRAY['morning', 'evening'],
  ARRAY['istighfar', 'faith_renewal', 'sabr', 'guidance_seeking'],
  false,
  'long',
  true,
  'Sayyidul Istighfar (Master of Seeking Forgiveness)',
  'Narrated by Shaddad ibn Aws. The Prophet ﷺ said: "Whoever says this during the day with firm faith in it and dies on that day before evening, he will be among the people of Paradise. And whoever says it at night with firm faith in it and dies before morning, he will be among the people of Paradise."'
),

-- 5. Du'a for Anxiety and Sorrow
(
  'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
  'Allahumma inni a''udhu bika minal-hammi wal-hazan, wa a''udhu bika minal-''ajzi wal-kasal, wa a''udhu bika minal-jubni wal-bukhl, wa a''udhu bika min ghalabatid-dayni wa qahrir-rijal.',
  'O Allah, I seek refuge in You from anxiety and sorrow, and I seek refuge in You from inability and laziness, and I seek refuge in You from cowardice and miserliness, and I seek refuge in You from being overwhelmed by debt and overpowered by people.',
  'hadith',
  'Sahih al-Bukhari',
  6369,
  NULL,
  'sahih',
  ARRAY['general', 'morning', 'evening'],
  ARRAY['anxiety', 'grief', 'hardship', 'sabr', 'reliance_on_allah'],
  false,
  'medium',
  true,
  'Du''a for Anxiety and Sorrow',
  'Narrated by Anas ibn Malik. The Prophet ﷺ used to frequently say this supplication. It covers 8 conditions grouped in 4 pairs of opposites.'
),

-- 6. Du'a for Afiyah (Complete Well-being)
(
  'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي',
  'Allahumma inni as''alukal-''afiyata fid-dunya wal-akhirah. Allahumma inni as''alukal-''afwa wal-''afiyata fi dini wa dunyaya wa ahli wa mali.',
  'O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for pardon and well-being in my religion, my worldly affairs, my family, and my wealth.',
  'hadith',
  'Sunan Abu Dawud',
  5074,
  NULL,
  'sahih',
  ARRAY['morning', 'evening'],
  ARRAY['tawakkul', 'shukr', 'sabr', 'reliance_on_allah', 'guidance_seeking'],
  false,
  'medium',
  true,
  'Du''a for Afiyah (Complete Well-being)',
  'Narrated by Abdullah ibn Umar. The Prophet ﷺ would never leave this supplication morning and evening.'
),

-- 7. Du'a for Entering the Market
(
  'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ حَيٌّ لَا يَمُوتُ بِيَدِهِ الْخَيْرُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
  'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu, yuhyi wa yumitu, wa huwa hayyun la yamutu, biyadihil-khayru, wa huwa ''ala kulli shay''in qadir.',
  'There is no god but Allah, alone, without partner. To Him belongs sovereignty and to Him belongs praise. He gives life and causes death, and He is the Living who does not die. In His hand is all good, and He is over all things capable.',
  'hadith',
  'Jami'' at-Tirmidhi',
  3428,
  NULL,
  'hasan',
  ARRAY['general'],
  ARRAY['dhikr', 'tawakkul', 'reliance_on_allah', 'shukr'],
  false,
  'medium',
  true,
  'Du''a for Entering the Market',
  'Narrated by Umar ibn al-Khattab. The Prophet ﷺ said: "Whoever enters the market and says this, Allah will record for him a million good deeds, erase a million evil deeds, and raise him a million degrees."'
),

-- 8. Supplication for Rectifying All Affairs (Ya Hayyu Ya Qayyum variant)
(
  'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
  'Ya Hayyu Ya Qayyum, bi rahmatika astaghith. Aslih li sha''ni kullahu, wa la takilni ila nafsi tarfata ''ayn.',
  'O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs for me, and do not entrust me to myself even for the blink of an eye.',
  'hadith',
  'Mustadrak al-Hakim',
  2000,
  NULL,
  'hasan',
  ARRAY['general', 'morning', 'evening'],
  ARRAY['anxiety', 'hardship', 'reliance_on_allah', 'tawakkul'],
  false,
  'short',
  true,
  'Supplication for Rectifying All Affairs',
  'Reported through multiple chains. A foundational supplication expressing complete dependence on Allah.'
),

-- 9. The Bedouin's Du'a (from the hadith of the Bedouin and the Prophet)
(
  'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاهْدِنِي وَارْزُقْنِي',
  'Allahumma ighfir li, warhamni, wahdini, warzuqni.',
  'O Allah, forgive me, have mercy on me, guide me, and provide for me.',
  'hadith',
  'Sahih Muslim',
  2696,
  NULL,
  'sahih',
  ARRAY['general'],
  ARRAY['istighfar', 'guidance_seeking', 'sabr', 'faith_renewal'],
  false,
  'short',
  true,
  'The Bedouin''s Du''a',
  'A Bedouin came to the Prophet ﷺ and embraced Islam. The Prophet ﷺ taught him this concise dua, saying these words "sum up for you your affairs of this world and the Hereafter." Sahih Muslim 2696.'
),

-- 10. Surah Al-Baqarah 2:286 - Rabbana la tu'akhidhna
(
  'رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ',
  'Rabbana la tu''akhidhna in nasina aw akhta''na. Rabbana wa la tahmil ''alayna isran kama hamaltahu ''alal-ladhina min qablina. Rabbana wa la tuhammilna ma la taqata lana bih. Wa''fu ''anna waghfir lana warhamna. Anta mawlana fansurna ''alal-qawmil-kafirin.',
  'Our Lord, do not impose blame upon us if we have forgotten or erred. Our Lord, and lay not upon us a burden like that which You laid upon those before us. Our Lord, and burden us not with that which we have no ability to bear. And pardon us, and forgive us, and have mercy upon us. You are our protector, so give us victory over the disbelieving people.',
  'quran',
  'Surah Al-Baqarah',
  NULL,
  '2:286',
  NULL,
  ARRAY['general', 'evening'],
  ARRAY['sabr', 'istighfar', 'hardship', 'reliance_on_allah', 'quran_reflection'],
  true,
  'long',
  true,
  'Rabbana La Tu''akhidhna (End of Surah Al-Baqarah)',
  'The final ayah of Surah Al-Baqarah. The Prophet ﷺ said: "Allah has granted each of these supplications." A comprehensive supplication covering forgiveness, mercy, and divine support.'
);

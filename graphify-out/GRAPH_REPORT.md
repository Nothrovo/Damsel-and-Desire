# Graph Report - Damsel and Desire  (2026-11-02)

## Corpus Check
- 162 files · ~4,038,765 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .example 1, .css 1)

## Summary
- 1469 nodes · 3626 edges · 97 communities (46 shown, 51 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e994ca2d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DamselDesireApp
- map3DUtils.ts
- combatActions.ts
- CodexCategoryView.ts
- featPickerModal
- all_migrations_combined.sql
- CalendarView.ts
- handbook/index.ts
- 1. TOP 10 ANIME ROMCOM SMA & PLOT POINTS
- BuilderWizardView.ts
- CharacterSheetView.ts
- vitest
- supabase.ts
- loveInterests.ts
- 20261008000003_codex_system.sql
- achievementAwardModal
- codexSecurity.test.ts
- progression.ts
- api/codex.ts
- package.json
- PLAN_CAMPAIGN_HARI_3_4_DAN_FAKSI.md
- 20261007000001_initial_schema.sql
- calendar.ts
- compendium.ts
- compilerOptions
- dmAuthStore
- 20261007000002_compendium_tables.sql
- characters.ts
- build_charsheet.py
- types/codex.ts
- 20261007000006_game_logic_rpc.sql
- schoolCalendar.test.ts
- CodexCharacterEditorModal.ts
- addLoveInterestModal
- subclassSelectModal
- 🌸 PANDUAN CAMPAIGN SESI 1 — PEKAN PERTAMA BULAN APRIL: *THE FIRST ENCOUNTER*
- quickVitalsPopover
- 🌟 Fitur Utama (Major Features)
- 🌸 [Nama Lengkap Romaji] ([Kanji])
- main.ts
- LandingView.ts
- 20261008000002_feat_and_achievement_system.sql
- public.get_love_interest_detail
- public.campaign_members
- 20261013000001_living_cost_and_savings_fix.sql
- vite-env.d.ts
- public.subclass_moves
- data.js
- 20261009000001_school_calendar.sql
- vercel.json
- Luna Hernandez (Front-End Specialist)
- Marcus Vance (Back-End & Database Architect)
- FeatPickerModal.ts
- Draft Sementara
- levelUpWizardModal
- Contoh Respons
- createCanonExpansionCharacters.py
- ATURAN PEMBUATAN KARAKTER, KONSISTENSI DATABASE & DEMOGRAFI KELAS
- CodexDetailView.ts
- types/index.ts
- showToast

## God Nodes (most connected - your core abstractions)
1. `DamselDesireApp` - 92 edges
2. `showToast()` - 75 edges
3. `updateCharacterDirect()` - 30 edges
4. `Character` - 30 edges
5. `calculateEffectiveStats()` - 29 edges
6. `resolvePortraitUrl()` - 27 edges
7. `dmAuthStore` - 27 edges
8. `attachSheetEvents()` - 26 edges
9. `vitest` - 23 edges
10. `Map2DRenderer` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Task 5: DM Character & Love Interest Creator / Editor Wizard with Supabase Sync` --references--> `dmUpsertCharacter()`  [INFERRED]
  docs/superpowers/plans/2026-10-20-codex-hierarchy-moves-rebalance-character-crud.md → src/api/codex.ts
- `Task 5: DM Character & Love Interest Creator / Editor Wizard with Supabase Sync` --references--> `loveInterestDetailModal`  [INFERRED]
  docs/superpowers/plans/2026-10-20-codex-hierarchy-moves-rebalance-character-crud.md → src/components/LoveInterestDetailModal.ts
- `Task 3: Character Sheet Move Card Direct Rolling & Filter Tabs (Fisik vs Sosial)` --references--> `resolveMoveRollParameters()`  [INFERRED]
  docs/superpowers/plans/2026-10-20-codex-hierarchy-moves-rebalance-character-crud.md → src/rules/combatActions.ts
- `Task 1: Type Definitions & Multi-Category Hierarchy Modeling` --references--> `CombatActionDefinition`  [INFERRED]
  docs/superpowers/plans/2026-10-20-codex-hierarchy-moves-rebalance-character-crud.md → src/types/index.ts
- `Task 5: DM Character & Love Interest Creator / Editor Wizard with Supabase Sync` --references--> `dmUploadCharacterImage()`  [INFERRED]
  docs/superpowers/plans/2026-10-20-codex-hierarchy-moves-rebalance-character-crud.md → src/api/codex.ts

## Import Cycles
- None detected.

## Communities (97 total, 51 thin omitted)

### Community 0 - "DamselDesireApp"
Cohesion: 0.05
Nodes (3): app, DamselDesireApp, SUPABASE_CONFIG

### Community 1 - "map3DUtils.ts"
Cohesion: 0.06
Nodes (49): three, Map2DRenderer, Map2DRendererOptions, Map3DRenderer, Map3DRendererOptions, create3DRoomGroup(), createCampusFacilitiesGroup(), createChainLinkFence() (+41 more)

### Community 2 - "combatActions.ts"
Cohesion: 0.09
Nodes (26): File Structure & Responsibilities, Files to Create:, Files to Modify:, Global Constraints, Kamus Karakter Hierarkis, Rework Action & Moves, dan DM Character Creator/Editor Implementation Plan, Review Focus, Task 2: Action & Move Rebalancing, Move Fisik vs Sosial, and Direct Dice Roller Linking, Task 3: Character Sheet Move Card Direct Rolling & Filter Tabs (Fisik vs Sosial) (+18 more)

### Community 3 - "CodexCategoryView.ts"
Cohesion: 0.16
Nodes (16): CODEX_HIERARCHY, fetchCodexCategories(), fetchCodexList(), getAllSubcategories(), isCharacterInSubcategory(), resolveCharacterAffiliations(), attachDmCodexBarEvents(), renderDmCodexBar() (+8 more)

### Community 5 - "all_migrations_combined.sql"
Cohesion: 0.07
Nodes (43): idx_archetype_moves_archetype, idx_calendar_progress_char, idx_campaign_members_user, idx_campaigns_join_code, idx_campaigns_owner, idx_character_secrets_campaign, idx_character_secrets_char, idx_characters_campaign (+35 more)

### Community 6 - "CalendarView.ts"
Cohesion: 0.19
Nodes (22): applyAddCustomEvent(), applyDeleteCustomEvent(), applyMarkMonthEvents(), applySaveMonthNote(), applySetCurrentMonth(), applyToggleEventDone(), saveSchoolCalendarState(), getMonthProgressiveStatus() (+14 more)

### Community 7 - "handbook/index.ts"
Cohesion: 0.11
Nodes (25): ch0_cover_intro, CHAPTER_10_ROMANCE_SECRETS, CHAPTER_11_DM_APPENDIX, ch1_character_creation, ch2_abilities_skills, CHAPTER_3_ARCHETYPES, CHAPTER_4_EKSKUL, CHAPTER_5_SOCIAL_FINANCES (+17 more)

### Community 8 - "1. TOP 10 ANIME ROMCOM SMA & PLOT POINTS"
Cohesion: 0.05
Nodes (37): 10. Bucchigiri?! / Shonan Junai Gumi, 10. Rascal Does Not Dream of Bunny Girl Senpai, 1. Kaguya-sama: Love Is War (*Kaguya-sama wa Kokurasetai*), 1. Tokyo Revengers, 1. TOP 10 ANIME ROMCOM SMA & PLOT POINTS, 2. TOP 10 ANIME GENG BERANDAL SEKOLAH & PLOT POINTS, 2. Toradora!, 2. Wind Breaker (+29 more)

### Community 9 - "BuilderWizardView.ts"
Cohesion: 0.11
Nodes (38): getArchetypeReworkData(), getSocialClassReworkData(), calculateAbilityModifier(), calculatePointBuyTotal(), calculateProficiencyBonus(), isValidStandardArray(), POINT_BUY_COSTS, rupiahToYen() (+30 more)

### Community 10 - "CharacterSheetView.ts"
Cohesion: 0.13
Nodes (37): toggleCalendarEvent(), updateCharacterSecret(), applyVitalChangeRpc(), calculateEffectiveStats(), extractAbilityScore(), getArchetypeStatBonus(), useFeatAction(), triggerPrintCharacterSheet() (+29 more)

### Community 11 - "vitest"
Cohesion: 0.09
Nodes (11): vitest, getCompendiumEquipmentPacks(), addItemModal, escapeHtml(), diceRollerModal, escapeHtml(), itemDetailModal, getAllCompendiumItems() (+3 more)

### Community 13 - "loveInterests.ts"
Cohesion: 0.15
Nodes (20): dmGetCharacter(), dmListAll(), SUPABASE_STORAGE_PORTRAITS_URL, fetchDynamicLoveInterestDetail(), fetchDynamicLoveInterests(), matchTargetToLoveInterest(), normalizeDbToLoveInterest(), escapeHtml() (+12 more)

### Community 14 - "20261008000003_codex_system.sql"
Cohesion: 0.09
Nodes (15): idx_codex_characters_category, idx_codex_characters_slug, idx_codex_dm_sessions_token, idx_codex_reveals_char, idx_codex_sections_char, public.codex_categories, public.codex_character_sections, public.codex_characters (+7 more)

### Community 16 - "codexSecurity.test.ts"
Cohesion: 0.05
Nodes (31): vite, buildLoveInterests(), findSection(), mapClassRoomToCategory(), parseDateSpots(), parseGifts(), parseHeartMilestones(), parsePersonalitySection() (+23 more)

### Community 17 - "progression.ts"
Cohesion: 0.13
Nodes (34): getCachedEkskul(), migrateCharacter(), migrateCharacters(), MigrationOptions, MigrationResult, normalizeGradeAndLevel(), calculateComposureGainAtLevel(), calculateHpGainAtLevel() (+26 more)

### Community 18 - "api/codex.ts"
Cohesion: 0.12
Nodes (26): buildCanonCard(), buildCanonDetail(), BUNDLED_PORTRAIT_SLUGS, CodexClubDirectory, dmBatchIntroduce(), dmBatchLockAll(), dmBatchSetTier(), dmGetLog() (+18 more)

### Community 19 - "package.json"
Cohesion: 0.08
Nodes (23): dependencies, @supabase/supabase-js, three, @types/three, description, devDependencies, typescript, vite (+15 more)

### Community 20 - "PLAN_CAMPAIGN_HARI_3_4_DAN_FAKSI.md"
Cohesion: 0.09
Nodes (22): 1. RINGKASAN KRISIS & OBJEKTIF UTAMA (THE TICKING CLOCK), 2. PETA KEKUATAN & STRUKTUR TIGA FAKSI, 3. JALAN CERITA HARI 3 (RABU), 4. JALAN CERITA HARI 4 (KAMIS), 5. TABEL STAT & MEKANIK BOS PERTARUNGAN, 6. 🔒 [SPOILER GM/DM ONLY] RAHASIA PLOT & TWIST DI BALIK LAYAR, Bos Lapangan: Kanzawa Ryuuji (金沢 竜二), Bos Tertinggi: Onizuka Gouki ("The Red Ogre") (+14 more)

### Community 21 - "20261007000001_initial_schema.sql"
Cohesion: 0.19
Nodes (18): idx_calendar_progress_char, idx_campaign_members_user, idx_campaigns_join_code, idx_campaigns_owner, idx_character_secrets_campaign, idx_character_secrets_char, idx_characters_campaign, idx_characters_owner (+10 more)

### Community 22 - "calendar.ts"
Cohesion: 0.20
Nodes (17): CalendarStateLoadResult, CalendarStateSaveResult, CalendarSyncListener, calendarSyncListeners, fetchSchoolCalendarState(), fetchSchoolCalendarStateResult(), getDefaultCalendarState(), loadLocalCalendarState() (+9 more)

### Community 23 - "compendium.ts"
Cohesion: 0.09
Nodes (26): getCalendarProgress(), getCharacterSecret(), getCachedArchetypes(), getCompendiumAbilities(), getCompendiumArchetypes(), getCompendiumBasicActions(), getCompendiumCalendarEvents(), getCompendiumEkskul() (+18 more)

### Community 24 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 25 - "dmAuthStore"
Cohesion: 0.15
Nodes (8): dmLogin(), dmLogout(), dmVerifySession(), RouteConfig, RouteHandler, dmAuthStore, Listener, storage

### Community 26 - "20261007000002_compendium_tables.sql"
Cohesion: 0.19
Nodes (15): idx_archetype_moves_archetype, idx_ekskul_moves_ekskul, idx_ekskul_subclasses_ekskul, idx_skills_ability, public.abilities, public.archetype_moves, public.archetypes, public.basic_actions (+7 more)

### Community 27 - "characters.ts"
Cohesion: 0.38
Nodes (15): createCharacterRpc(), deleteCharacter(), getCharacter(), getLocalRoster(), importLegacyCharacter(), isUuid(), listAllCharacters(), listCampaignCharacters() (+7 more)

### Community 28 - "build_charsheet.py"
Cohesion: 0.15
Nodes (3): build_charsheet(), add_p(), format_run()

### Community 29 - "types/codex.ts"
Cohesion: 0.19
Nodes (12): Task 1: Type Definitions & Multi-Category Hierarchy Modeling, CodexCategory, CodexCharacterCard, CodexCharacterDetail, CodexRootGroup, CodexRootGroupId, CodexSectionDetail, CodexSectionKey (+4 more)

### Community 30 - "20261007000006_game_logic_rpc.sql"
Cohesion: 0.19
Nodes (5): public.adjust_savings(), public.apply_vital_change(), public.create_character(), public.long_rest(), public.short_rest()

### Community 31 - "schoolCalendar.test.ts"
Cohesion: 0.18
Nodes (14): onCalendarSyncStatusChange(), calculateCalendarProgressStats(), SCHOOL_CALENDAR_MONTHS, SCHOOL_DAILY_ROUTINES, SCHOOL_ELITE_TRADITIONS, SCHOOL_MONTH_ORDER, SCHOOL_ROMANCE_ARCS, YEAR_TWO_PREVIEW (+6 more)

### Community 32 - "CodexCharacterEditorModal.ts"
Cohesion: 0.20
Nodes (8): Task 5: DM Character & Love Interest Creator / Editor Wizard with Supabase Sync, compressImageFile(), DEFAULT_CODEX_CATEGORIES, dmDeleteCharacter(), dmUploadCharacterImage(), HOUSEN_CLUB_DIRECTORIES, invalidateLoveInterestsCache(), codexCharacterEditorModal

### Community 36 - "🌸 PANDUAN CAMPAIGN SESI 1 — PEKAN PERTAMA BULAN APRIL: *THE FIRST ENCOUNTER*"
Cohesion: 0.07
Nodes (29): ⏰ 1. Struktur Ritme Harian (Daily Slot Loop) untuk DM, 👥 2. Roster Lengkap 21 Karakter Canon Sekolah, 🌸 3. HARI 1 (SENIN): Gerbang Sakura & Upacara Akbar (*Nyūgakushiki*), 🏫 4. HARI 2 (SELASA): Homeroom Perdana Chihiro-sensei, Penentuan Meja & Peluit Koridor, 🩺 5. HARI 3 (RABU): Tes Kemampuan Awal, Rahasia Perpustakaan & Uji Fisik Lapangan, ⚔️ 6. HARI 4 (KAMIS): Pekan Demonstrasi Panggung & Perekrutan Klub (*Bukatsu Showcase*), 🍰 7. HARI 5 (JUMAT): Piket Senja, Stempel Ruang OSIS & Pesta Tartlet Penutup, 📈 8. Panduan Pasca-Pekan Pertama: Evaluasi Afeksi & Transisi Akhir Pekan (+21 more)

### Community 40 - "🌟 Fitur Utama (Major Features)"
Cohesion: 0.11
Nodes (18): 1. 💖 Affection Tracker & Dynamic Love Interest System (DM Only), 1. Menjalankan Server Pengembangan Lokal, 2. 🌸 Kamus Karakter & Direktori Sekolah (`/codex`), 2. Membangun Aplikasi Produksi & Offline Handbook, 3. 📅 Kalender Sekolah Interaktif 12 Bulan (`/calendar`), 3. Menjalankan Unit Tests, 4. 📖 Modular Player's Handbook (PHB), 4. Sinkronisasi Data Love Interest & Codex (+10 more)

### Community 41 - "🌸 [Nama Lengkap Romaji] ([Kanji])"
Cohesion: 0.14
Nodes (13): 👑 Catatan Khusus DM (DM Notes - Mode DM Only), Celah Emosional & Kelemahan Batin, Gaya Bicara & Kebiasaan Khas, 👥 Jaringan Relasi (Relationships - Tier 2), Kehidupan di Housen Academy & Klub Ekskul, 🧠 Kepribadian & Sifat (Personality - Tier 2), 📖 Latar Belakang & Kehidupan Klub (Background - Tier 2), Masa Kecil & Keluarga (+5 more)

### Community 42 - "main.ts"
Cohesion: 0.05
Nodes (20): backstoryModal, baitoModal, dmAuthModal, dmRevealHistoryModal, setMobileNavigationOpen(), attachNavbarEvents(), getActivePath(), renderNavbar() (+12 more)

### Community 43 - "LandingView.ts"
Cohesion: 0.07
Nodes (31): getCurrentUser(), getSession(), onAuthStateChange(), signInWithOAuth(), signInWithOtp(), signOut(), updateProfile(), listMyCharacters (+23 more)

### Community 46 - "20261008000002_feat_and_achievement_system.sql"
Cohesion: 0.70
Nodes (4): idx_compendium_feats_category, idx_compendium_feats_subcategory, public.compendium_achievements, public.compendium_feats

### Community 88 - "Luna Hernandez (Front-End Specialist)"
Cohesion: 0.20
Nodes (9): 🤝 Batasan Kerja & Kolaborasi dengan Tim Backend, 🎨 Brand Identity, Tema & Estetika Visual, Format Laporan Setiap Selesai Tugas, Luna Hernandez (Front-End Specialist), 🎭 Persona & Gaya Komunikasi, 🛠️ Stack Teknologi (Damsel & Desire), 📋 Standar Kode & Protokol Laporan Akhir, Standar Koding (+1 more)

### Community 89 - "Marcus Vance (Back-End & Database Architect)"
Cohesion: 0.20
Nodes (9): 🔒 Aturan Keamanan & Akses Data (CRITICAL & STRICT), 🤝 Batasan Kerja & Kolaborasi dengan Luna (Front-End), Format Laporan Setiap Selesai Tugas, Marcus Vance (Back-End & Database Architect), 🎭 Persona & Gaya Komunikasi, 📜 Protokol Konsistensi Kanon & Database (Housen Academy), 🛠️ Stack Teknologi Backend & Arsitektur Data, 📋 Standar Kode & Protokol Laporan Akhir (+1 more)

### Community 91 - "FeatPickerModal.ts"
Cohesion: 0.18
Nodes (16): FeatPickerOptions, ALL_ACHIEVEMENTS, FALLBACK_DD_DATA, ALL_FEATS, checkFeatEligibility(), getAvailableFeats(), grantFeat(), LevelUpChoices (+8 more)

### Community 92 - "Draft Sementara"
Cohesion: 0.25
Nodes (7): Archtype (Ras), Brainstorms, Draft Sementara, Ekskul (Class), Notes, Social Class (Background), Stat

### Community 96 - "Contoh Respons"
Cohesion: 0.29
Nodes (6): /ask — Direct & To-The-Point Answering Mode, Contoh 1: Perintah Terminal, Contoh 2: Pertanyaan Konseptual, Contoh 3: Solusi Error, Contoh Respons, Prinsip Utama

### Community 98 - "createCanonExpansionCharacters.py"
Cohesion: 0.48
Nodes (3): generate_markdown(), generate_prompt_md(), main()

### Community 99 - "ATURAN PEMBUATAN KARAKTER, KONSISTENSI DATABASE & DEMOGRAFI KELAS"
Cohesion: 0.40
Nodes (4): 1. PANTANGAN KARAKTER FIKTIF SEKALI PAKAI (ANTI-DISPOSABLE CHARACTERS), 2. PROTOKOL PENAMBAHAN KARAKTER BARU (MANDATORY REGISTRATION), 3. STRUKTUR & DEMOGRAFI KELAS, ATURAN PEMBUATAN KARAKTER, KONSISTENSI DATABASE & DEMOGRAFI KELAS

### Community 100 - "CodexDetailView.ts"
Cohesion: 0.20
Nodes (13): dmUpsertCharacter(), renderCodexSilhouetteSvg(), codexRealtime, CodexRealtimePayload, CodexRevealListener, createSakuraPetals(), triggerSakuraUnlockAnimation(), escapeHtml() (+5 more)

### Community 102 - "types/index.ts"
Cohesion: 0.06
Nodes (34): CharacterMovesSummary, AdjustSavingsRpcResult, ArchetypeMoveCompendium, ArchetypeRollBonus, ArchetypeSocialFocus, ArchetypeUniqueTrait, CalendarProgress, Campaign (+26 more)

### Community 106 - "showToast"
Cohesion: 0.18
Nodes (10): adjustSavingsRpc(), isValidUuid(), longRestRpc(), shortRestRpc(), VitalType, showToast(), resetFeatUsage(), characterStore (+2 more)

## Knowledge Gaps
- **2 isolated node(s):** `@types/three`, `typescript`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 445 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `map3DUtils.ts`, `combatActions.ts`, `CodexCategoryView.ts`, `handbook/index.ts`, `BuilderWizardView.ts`, `showToast`, `LandingView.ts`, `loveInterests.ts`, `codexSecurity.test.ts`, `progression.ts`, `api/codex.ts`, `package.json`, `compendium.ts`, `FeatPickerModal.ts`, `schoolCalendar.test.ts`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `@types/three`, `typescript` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DamselDesireApp` be split into smaller, more focused modules?**
  _Cohesion score 0.05442329227323628 - nodes in this community are weakly interconnected._
- **Why does `showToast()` connect `showToast` to `CodexCategoryView.ts`, `CalendarView.ts`, `BuilderWizardView.ts`, `CharacterSheetView.ts`, `vitest`, `loveInterests.ts`, `achievementAwardModal`, `progression.ts`, `api/codex.ts`, `compendium.ts`, `dmAuthStore`, `CodexCharacterEditorModal.ts`, `addLoveInterestModal`, `subclassSelectModal`, `quickVitalsPopover`, `main.ts`, `LandingView.ts`, `FeatPickerModal.ts`, `levelUpWizardModal`, `CodexDetailView.ts`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `map3DUtils.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05659583420997265 - nodes in this community are weakly interconnected._
- **Why does `dmAuthStore` connect `dmAuthStore` to `CodexCharacterEditorModal.ts`, `CodexCategoryView.ts`, `CodexDetailView.ts`, `CalendarView.ts`, `main.ts`, `loveInterests.ts`, `api/codex.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `combatActions.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09425287356321839 - nodes in this community are weakly interconnected._
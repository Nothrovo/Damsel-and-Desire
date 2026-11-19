-- ============================================================================
-- Migration: 20261116000001_persona_system.sql
-- Description: Menambahkan kolom persona (JSONB) pada tabel characters
--              dan memperbarui batasan level menjadi 1-6 untuk Persona progression.
-- ============================================================================

-- 1. Tambahkan kolom persona ke tabel characters jika belum ada
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS persona JSONB DEFAULT NULL;

-- 2. Update level check constraint agar mendukung level 1 sampai 6 (Kelas 10-12)
DO $$
BEGIN
  ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_level_check;
  ALTER TABLE public.characters ADD CONSTRAINT characters_level_check CHECK (level BETWEEN 1 AND 6);
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

COMMENT ON COLUMN public.characters.persona IS
  'Menyimpan status awakening, Arcana, Persona, SP, amunisi pistol, dan spell loadout pemain';

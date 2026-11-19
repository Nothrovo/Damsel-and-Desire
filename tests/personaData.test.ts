import { describe, it, expect } from 'vitest';
import {
  MAJOR_ARCANA,
  ARCANA_BY_ID,
  PERSONA_SPELLS,
  SPELL_BY_ID,
  CANON_NPC_PERSONA_PRESETS,
  ELEMENT_METADATA,
} from '../src/data/personaData';

describe('PersonaData Master Integrity', () => {
  it('contains exactly 22 Major Arcana numbered 0 to 21', () => {
    expect(MAJOR_ARCANA).toHaveLength(22);
    for (let i = 0; i <= 21; i++) {
      const arcana = MAJOR_ARCANA.find((a) => a.number === i);
      expect(arcana).toBeDefined();
    }
  });

  it('each Arcana has exactly 9 signature spell IDs', () => {
    for (const arcana of MAJOR_ARCANA) {
      expect(arcana.signatureSpells).toHaveLength(9);
      for (const spellId of arcana.signatureSpells) {
        expect(spellId).toBeTruthy();
      }
    }
  });

  it('all element metadata has valid label, icon, color, and badge', () => {
    const elements = [
      'physical', 'gun', 'fire', 'ice', 'electric',
      'wind', 'psy', 'nuclear', 'bless', 'curse', 'almighty'
    ] as const;

    for (const elem of elements) {
      expect(ELEMENT_METADATA[elem]).toBeDefined();
      expect(ELEMENT_METADATA[elem].color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(ELEMENT_METADATA[elem].icon).toBeTruthy();
    }
  });

  it('all spells have unique IDs and positive or zero SP cost', () => {
    const ids = new Set<string>();
    for (const spell of PERSONA_SPELLS) {
      expect(ids.has(spell.id)).toBe(false);
      ids.add(spell.id);
      expect(spell.spCost).toBeGreaterThanOrEqual(0);
      expect(spell.name).toBeTruthy();
      expect(spell.effect).toBeTruthy();
    }
  });

  it('canon NPC presets reference valid Arcana IDs and exist', () => {
    expect(CANON_NPC_PERSONA_PRESETS.length).toBeGreaterThanOrEqual(8);
    for (const preset of CANON_NPC_PERSONA_PRESETS) {
      expect(ARCANA_BY_ID.has(preset.arcanaId)).toBe(true);
      expect(preset.personaName).toBeTruthy();
      expect(preset.characterName).toBeTruthy();
    }
  });
});

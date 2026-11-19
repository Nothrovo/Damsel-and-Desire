import { describe, it, expect } from 'vitest';
import {
  fromBattleHp,
  fromBattleSp,
  syncPersonaToSheetVitals,
  parseDiceExpression,
  scaleDiceExpression,
  resolveSpellDamageSpec,
  createDefaultPersonaData,
} from '../src/rules/personaRules';
import {
  PERSONA_ITEM_CATALOG,
  PERSONA_ITEM_BY_ID,
  getDefaultPersonaStarterItems,
} from '../src/data/personaItems';
import {
  PERSONA_MELEE_CATALOG,
  PERSONA_GUN_CATALOG,
  DEFAULT_MELEE_WEAPON,
  DEFAULT_GUN_WEAPON,
} from '../src/data/personaWeapons';
import { SPELL_BY_ID } from '../src/data/personaData';
import type { Character } from '../src/types';

function makeMockChar(): Character {
  return {
    id: 'test-char-v3',
    owner_id: 'user-1',
    campaign_id: null,
    name: 'Kinohara Ren',
    ekskul_id: 'broadcasting',
    social_class_id: 'middle',
    archetype_id: 'rebel',
    level: 1,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    abilities: { physique: 8, intelligent: 12, looks: 10, mind: 10, talent: 14, luck: 10 },
    proficient_skills: [],
    proficient_saves: [],
    vitals: {
      physicalHpCurrent: 10,
      physicalHpMax: 10,
      physicalHpTemp: 0,
      composureCurrent: 11,
      composureMax: 11,
      composureTemp: 0,
      restDiceTotal: 1,
      restDiceSpent: 0,
      heartInspiration: false,
    },
    finances: { dailyMoneyAmount: 1000, savingsAmount: 5000, job: 'None', jobWageAmount: 0 },
    inventory: { bagItems: [], keepsakes: [] },
    backstory_fields: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '' },
  };
}

describe('Persona v3 Revisions — Sync, Dice Parser, Items & Weapons', () => {
  it('floors battle HP/SP down when converting back to normal sheet vitals (e.g. 75 -> 7)', () => {
    expect(fromBattleHp(75)).toBe(7);
    expect(fromBattleHp(79)).toBe(7);
    expect(fromBattleHp(70)).toBe(7);
    expect(fromBattleHp(9)).toBe(0);
    expect(fromBattleSp(105)).toBe(10);
    expect(fromBattleSp(99)).toBe(9);

    const char = makeMockChar();
    syncPersonaToSheetVitals(char, 75, 89);
    expect(char.vitals.physicalHpCurrent).toBe(7);
    expect(char.vitals.composureCurrent).toBe(8);
  });

  it('parses and scales multi-dice expressions accurately', () => {
    expect(parseDiceExpression('d6')).toEqual({ count: 1, sides: 6, modifier: 0, normalized: '1d6' });
    expect(parseDiceExpression('2d8 + 3')).toEqual({ count: 2, sides: 8, modifier: 3, normalized: '2d8' });
    expect(parseDiceExpression('1d4-1', 2)).toEqual({ count: 1, sides: 4, modifier: 1, normalized: '1d4' });

    // Multi-bullet burst scaling (4 shots of 1d6 = 4d6, 3 allies of 1d8 = 3d8)
    expect(scaleDiceExpression('1d6', 4)).toBe('4d6');
    expect(scaleDiceExpression('2d6', 3)).toBe('6d6');
    expect(scaleDiceExpression('1d8', 3)).toBe('3d8');
  });

  it('resolves PersonaSpell damage/heal formulas into focused roll specs', () => {
    const agi = SPELL_BY_ID.get('sp_agi');
    expect(agi).toBeDefined();
    if (agi) {
      const spec = resolveSpellDamageSpec(agi, { str: { mod: -1 }, mag: { mod: 3 } });
      expect(spec).toEqual({ dice: '1d6', mod: 3, isHeal: false });
    }
  });

  it('provides official Persona 5 item catalog across all categories and starter bag', () => {
    const categories = new Set(PERSONA_ITEM_CATALOG.map((i) => i.category));
    expect(categories.has('heal_hp')).toBe(true);
    expect(categories.has('heal_sp')).toBe(true);
    expect(categories.has('heal_both')).toBe(true);
    expect(categories.has('damage')).toBe(true);
    expect(categories.has('buff')).toBe(true);
    expect(categories.has('debuff')).toBe(true);
    expect(categories.has('cure')).toBe(true);

    const starters = getDefaultPersonaStarterItems();
    expect(starters.length).toBeGreaterThanOrEqual(3);
    starters.forEach((s) => {
      expect(PERSONA_ITEM_BY_ID.has(s.itemId)).toBe(true);
    });
  });

  it('provides official Persona 5 melee and gun weapon catalogs and attaches them to new Persona data', () => {
    expect(PERSONA_MELEE_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(PERSONA_GUN_CATALOG.length).toBeGreaterThanOrEqual(7);
    PERSONA_GUN_CATALOG.forEach((g) => {
      expect(g.maxBullets).toBeGreaterThanOrEqual(2);
    });

    const char = makeMockChar();
    const persona = createDefaultPersonaData(char, 'death', 'Thanatos', 'Coffin wings');
    expect(persona.personaImagePath).toBe('');
    expect(persona.equippedMeleeId).toBe(DEFAULT_MELEE_WEAPON.id);
    expect(persona.equippedGunId).toBe(DEFAULT_GUN_WEAPON.id);
    expect(persona.items?.length).toBeGreaterThan(0);
    expect(persona.weapons?.length).toBe(2);
  });
});

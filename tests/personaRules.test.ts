import { describe, it, expect } from 'vitest';
import {
  toBattleHp,
  toBattleMaxHp,
  toBattleSp,
  toBattleMaxSp,
  fromBattleHp,
  fromBattleSp,
  calculatePersonaStats,
  calculateSpellDC,
  calculateAttackBonus,
  getComposureState,
  getAvailableSignatureSpells,
  getMaxEquippedSpells,
  getAoaAllyDie,
  getPersonaGrowth,
  createDefaultPersonaData,
} from '../src/rules/personaRules';
import type { Character } from '../src/types';

describe('PersonaRules Engine', () => {
  it('correctly converts between standard sheet stats and Battle Deck values (×10)', () => {
    expect(toBattleHp(12)).toBe(120);
    expect(toBattleMaxHp(15)).toBe(150);
    expect(toBattleSp(8)).toBe(80);
    expect(toBattleMaxSp(14)).toBe(140);

    expect(fromBattleHp(120)).toBe(12);
    expect(fromBattleSp(80)).toBe(8);
  });

  it('calculates persona growth bonus based on character level', () => {
    expect(getPersonaGrowth(1)).toBe(2);
    expect(getPersonaGrowth(4)).toBe(2);
    expect(getPersonaGrowth(5)).toBe(4);
    expect(getPersonaGrowth(6)).toBe(4);
  });

  it('calculates STR, MAG, END correctly based on Arcana and level', () => {
    const mockChar: Character = {
      id: 'test-char',
      owner_id: 'test-user',
      campaign_id: null,
      name: 'Rei Amamiya',
      ekskul_id: 'broadcasting',
      social_class_id: 'middle',
      archetype_id: 'rebel',
      level: 1,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      abilities: {
        physique: 12,    // +1
        intelligent: 10, // +0
        looks: 15,       // +2
        mind: 14,        // +2
        talent: 10,      // +0
        luck: 10,        // +0
      },
      proficient_skills: [],
      proficient_saves: [],
      vitals: {
        physicalHpCurrent: 12,
        physicalHpMax: 12,
        physicalHpTemp: 0,
        composureCurrent: 14,
        composureMax: 14,
        composureTemp: 0,
        restDiceTotal: 1,
        restDiceSpent: 0,
        heartInspiration: false,
      },
      finances: { dailyMoneyAmount: 1000, savingsAmount: 5000, job: 'None', jobWageAmount: 0 },
      inventory: { bagItems: [], keepsakes: [] },
      backstory_fields: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '' },
    };

    // Arcana Lovers (VI): MAG = Looks + Growth (15 + 2 = 17 -> +3 Mod)
    // STR = Physique (12 -> +1 Mod)
    // END = Mind (14 -> +2 Mod)
    const statsLovers = calculatePersonaStats(mockChar, 'lovers');
    expect(statsLovers.str.score).toBe(12);
    expect(statsLovers.str.mod).toBe(1);
    expect(statsLovers.mag.score).toBe(17);
    expect(statsLovers.mag.mod).toBe(3);
    expect(statsLovers.end.score).toBe(14);
    expect(statsLovers.end.mod).toBe(2);

    // Arcana Emperor (IV): MAG and STR both use Physique + Growth (12 + 2 = 14 -> +2 Mod)
    const statsEmperor = calculatePersonaStats(mockChar, 'emperor');
    expect(statsEmperor.str.score).toBe(14);
    expect(statsEmperor.str.mod).toBe(2);
    expect(statsEmperor.mag.score).toBe(14);
    expect(statsEmperor.mag.mod).toBe(2);
  });

  it('calculates Spell DC and Attack bonus accurately', () => {
    // DC = 8 + PB + Mod
    expect(calculateSpellDC(2, 3)).toBe(13);
    expect(calculateSpellDC(3, 4)).toBe(15);

    // Attack Bonus = Mod + PB
    expect(calculateAttackBonus(3, 2)).toBe(5);
    expect(calculateAttackBonus(1, 2)).toBe(3);
  });

  it('determines composure states: Steady, Salting, and Meltdown', () => {
    expect(getComposureState(80, 100)).toBe('steady');
    expect(getComposureState(50, 100)).toBe('salting'); // <= 50%
    expect(getComposureState(20, 100)).toBe('salting');
    expect(getComposureState(0, 100)).toBe('meltdown');
    expect(getComposureState(-5, 100)).toBe('meltdown');
  });

  it('correctly tracks available signature spells and max equipped spells by level', () => {
    expect(getAvailableSignatureSpells(1)).toEqual([0, 1]);
    expect(getAvailableSignatureSpells(3)).toEqual([0, 1, 2, 3]);
    expect(getAvailableSignatureSpells(5)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(getAvailableSignatureSpells(6)).toHaveLength(9);

    expect(getMaxEquippedSpells(1)).toBe(3);
    expect(getMaxEquippedSpells(3)).toBe(5);
    expect(getMaxEquippedSpells(5)).toBe(8);
    expect(getMaxEquippedSpells(6)).toBe(10);
  });

  it('returns correct All-Out Attack dice per level', () => {
    expect(getAoaAllyDie(1)).toBe('1d8');
    expect(getAoaAllyDie(2)).toBe('1d8');
    expect(getAoaAllyDie(3)).toBe('1d10');
    expect(getAoaAllyDie(4)).toBe('1d10');
    expect(getAoaAllyDie(5)).toBe('1d12');
    expect(getAoaAllyDie(6)).toBe('1d12');
  });

  it('creates complete default persona data with ×10 vitals and 8 bullets', () => {
    const mockChar: Character = {
      id: 'test-char',
      owner_id: 'test-user',
      campaign_id: null,
      name: 'Test Character',
      ekskul_id: 'soccer',
      social_class_id: 'middle',
      archetype_id: 'athlete',
      level: 2,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      abilities: { physique: 14, intelligent: 10, looks: 10, mind: 12, talent: 10, luck: 10 },
      proficient_skills: [],
      proficient_saves: [],
      vitals: {
        physicalHpCurrent: 14,
        physicalHpMax: 14,
        physicalHpTemp: 0,
        composureCurrent: 12,
        composureMax: 12,
        composureTemp: 0,
        restDiceTotal: 2,
        restDiceSpent: 0,
        heartInspiration: false,
      },
      finances: { dailyMoneyAmount: 1000, savingsAmount: 5000, job: 'None', jobWageAmount: 0 },
      inventory: { bagItems: [], keepsakes: [] },
      backstory_fields: { personality: '', ideals: '', bonds: '', flaws: '', backstory: '' },
    };

    const persona = createDefaultPersonaData(mockChar, 'chariot', 'Captain Kidd', 'Robotic pirate');
    expect(persona.isAwakened).toBe(true);
    expect(persona.arcanaId).toBe('chariot');
    expect(persona.personaName).toBe('Captain Kidd');
    expect(persona.currentHp).toBe(140);
    expect(persona.maxHp).toBe(140);
    expect(persona.currentSp).toBe(120);
    expect(persona.maxSp).toBe(120);
    expect(persona.gunBullets).toBe(8);
    expect(persona.maxGunBullets).toBe(8);
    expect(persona.encounterActive).toBe(false);
  });
});

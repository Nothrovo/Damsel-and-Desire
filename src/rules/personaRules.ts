// ============================================================================
// Persona 5 Royal Add-On System Rules Engine & Calculation Logic
// ============================================================================

import type { ArcanaId, CharacterPersona } from '../types/persona';
import type { Character } from '../types';

export const DEFAULT_MAX_BULLETS = 8;

export const SP_COST_TABLE = {
  tier0: 0,
  tier0Repeat: 4,
  tier1: 6,
  tier2: 12,
  tier3: 18,
  tier4: 28,
  tier5: 40,
  apex: 60,
} as const;

/**
 * Convert standard D&D/Damsel HP to Battle Deck HP (×10)
 */
export function toBattleHp(physicalHpCurrent: number): number {
  return Math.max(0, Math.round((physicalHpCurrent || 0) * 10));
}

export function toBattleMaxHp(physicalHpMax: number): number {
  return Math.max(10, Math.round((physicalHpMax || 1) * 10));
}

/**
 * Convert Composure/Mental HP to Battle Deck SP (×10)
 */
export function toBattleSp(composureCurrent: number): number {
  return Math.max(0, Math.round((composureCurrent || 0) * 10));
}

export function toBattleMaxSp(composureMax: number): number {
  return Math.max(10, Math.round((composureMax || 1) * 10));
}

/**
 * Convert Battle Deck values back to standard sheet numbers (÷10, rounded)
 */
export function fromBattleHp(battleHp: number): number {
  return Math.max(0, Math.round(battleHp / 10));
}

export function fromBattleSp(battleSp: number): number {
  return Math.max(0, Math.round(battleSp / 10));
}

/**
 * Standard D&D ability modifier formula: floor((score - 10) / 2)
 */
export function getStatModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Persona Growth bonus: +2 at Level 1 (Initial), +4 at Level 5 (Second Awakening)
 */
export function getPersonaGrowth(level: number): number {
  if (level >= 5) return 4;
  if (level >= 1) return 2;
  return 0;
}

/**
 * Calculate the 3 Core Persona Stats:
 * 1. Strength (STR) -> derived from Physique
 * 2. Magic (MAG) -> derived from Arcana primary stat + Persona Growth (max 22)
 * 3. Endurance (END) -> derived from Mind
 */
export function calculatePersonaStats(
  char: Character,
  arcanaId?: ArcanaId,
  worldChosenStat?: 'physique' | 'intelligent' | 'looks' | 'mind' | 'talent' | 'luck'
) {
  const level = Math.max(1, Math.min(6, char.level || 1));
  const growth = getPersonaGrowth(level);
  const abilities = char.abilities || {
    physique: 10,
    intelligent: 10,
    looks: 10,
    mind: 10,
    talent: 10,
    luck: 10,
  };

  // 1. STR derives from Physique
  let strScore = abilities.physique;
  // If Arcana uses Physique (Emperor, Chariot, Strength), growth applies to STR too
  if (arcanaId === 'emperor' || arcanaId === 'chariot' || arcanaId === 'strength' || (arcanaId === 'world' && worldChosenStat === 'physique')) {
    strScore = Math.min(22, strScore + growth);
  }

  // 2. MAG derives from Arcana primary stat
  let arcanaBaseStat = abilities.physique;
  switch (arcanaId) {
    case 'fool':
    case 'fortune':
      arcanaBaseStat = abilities.luck;
      break;
    case 'magician':
    case 'hermit':
    case 'justice':
    case 'temperance':
      arcanaBaseStat = abilities.intelligent;
      break;
    case 'priestess':
    case 'hierophant':
    case 'moon':
    case 'judgement':
      arcanaBaseStat = abilities.mind;
      break;
    case 'empress':
    case 'lovers':
    case 'devil':
    case 'sun':
      arcanaBaseStat = abilities.looks;
      break;
    case 'hangedman':
    case 'death':
    case 'star':
      arcanaBaseStat = abilities.talent;
      break;
    case 'emperor':
    case 'chariot':
    case 'strength':
    case 'tower':
      arcanaBaseStat = abilities.physique;
      break;
    case 'world':
      if (worldChosenStat && abilities[worldChosenStat] !== undefined) {
        arcanaBaseStat = abilities[worldChosenStat];
      } else {
        arcanaBaseStat = abilities.intelligent;
      }
      break;
    default:
      arcanaBaseStat = abilities.intelligent;
  }

  const magScore = Math.min(22, arcanaBaseStat + growth);

  // 3. END derives from Mind (if Mind is Arcana stat, growth applies to END too)
  let endScore = abilities.mind;
  if (arcanaId === 'priestess' || arcanaId === 'hierophant' || arcanaId === 'moon' || arcanaId === 'judgement' || (arcanaId === 'world' && worldChosenStat === 'mind')) {
    endScore = Math.min(22, endScore + growth);
  }

  const strMod = getStatModifier(strScore);
  const magMod = getStatModifier(magScore);
  const endMod = getStatModifier(endScore);

  return {
    str: { score: strScore, mod: strMod },
    mag: { score: magScore, mod: magMod },
    end: { score: endScore, mod: endMod },
    growth,
  };
}

/**
 * Standard proficiency bonus based on character level:
 * Lv 1-4: +2, Lv 5-6: +3
 */
export function getProficiencyBonus(level: number): number {
  return level >= 5 ? 3 : 2;
}

/**
 * Persona Attack Roll Bonus
 * Physical/Gun: d20 + STR Mod + PB
 * Magic: d20 + MAG Mod + PB
 */
export function calculateAttackBonus(mod: number, profBonus: number): number {
  return mod + profBonus;
}

/**
 * Persona Spell Save DC
 * Magic: 8 + PB + MAG Mod
 * Physical: 8 + PB + STR Mod
 */
export function calculateSpellDC(profBonus: number, mod: number): number {
  return 8 + profBonus + mod;
}

/**
 * Composure State Determination
 * Steady: > 50%
 * Salting: <= 50% (Locks Tier IV-V, unlocks Persona Surge)
 * Meltdown: 0 SP (Lumpuh secara Persona)
 */
export function getComposureState(currentSp: number, maxSp: number): 'steady' | 'salting' | 'meltdown' {
  if (currentSp <= 0) return 'meltdown';
  if (maxSp > 0 && currentSp <= maxSp * 0.5) return 'salting';
  return 'steady';
}

/**
 * Indices of unlocked Signature Spells (1 to 9, zero-indexed 0 to 8)
 * Lv 1: #1-2 (indices 0, 1)
 * Lv 2: #1-3 (indices 0, 1, 2)
 * Lv 3: #1-4 (indices 0, 1, 2, 3)
 * Lv 4: #1-5 (indices 0, 1, 2, 3, 4)
 * Lv 5: #1-7 (indices 0..6, unlocks Post-Awakening #7)
 * Lv 6: #1-9 (all 9)
 */
export function getAvailableSignatureSpells(level: number): number[] {
  const lvl = Math.max(1, Math.min(6, level || 1));
  if (lvl === 1) return [0, 1];
  if (lvl === 2) return [0, 1, 2];
  if (lvl === 3) return [0, 1, 2, 3];
  if (lvl === 4) return [0, 1, 2, 3, 4];
  if (lvl === 5) return [0, 1, 2, 3, 4, 5, 6];
  return [0, 1, 2, 3, 4, 5, 6, 7, 8];
}

/**
 * Maximum equipped Spell Pilihan that a character can bring
 */
export function getMaxEquippedSpells(level: number): number {
  const lvl = Math.max(1, Math.min(6, level || 1));
  switch (lvl) {
    case 1: return 3;
    case 2: return 4;
    case 3: return 5;
    case 4: return 6;
    case 5: return 8;
    case 6: return 10;
    default: return 3;
  }
}

/**
 * All-Out Attack (AOA) damage dice per active ally
 */
export function getAoaAllyDie(level: number): string {
  const lvl = Math.max(1, Math.min(6, level || 1));
  if (lvl <= 2) return '1d8';
  if (lvl <= 4) return '1d10';
  return '1d12';
}

/**
 * Create default CharacterPersona data for an awakened character
 */
export function createDefaultPersonaData(
  char: Character,
  arcanaId: ArcanaId,
  personaName: string,
  personaVisual: string = '',
  personaImagePath: string = '',
  worldChosenStat?: 'physique' | 'intelligent' | 'looks' | 'mind' | 'talent' | 'luck'
): CharacterPersona {
  const level = Math.max(1, Math.min(6, char.level || 1));
  const maxHp = toBattleMaxHp(char.vitals?.physicalHpMax || 10);
  const currentHp = toBattleHp(char.vitals?.physicalHpCurrent || 10);
  const maxSp = toBattleMaxSp(char.vitals?.composureMax || 10);
  const currentSp = toBattleSp(char.vitals?.composureCurrent || 10);

  return {
    isAwakened: true,
    awakeningLevel: level >= 5 ? 2 : 1,
    arcanaId,
    personaName: (personaName || 'Unknown').trim(),
    personaVisual: personaVisual || '',
    personaImagePath: personaImagePath || '',
    equippedSpells: [],
    currentHp,
    maxHp,
    currentSp,
    maxSp,
    gunBullets: DEFAULT_MAX_BULLETS,
    maxGunBullets: DEFAULT_MAX_BULLETS,
    encounterActive: false,
    worldChosenStat,
  };
}

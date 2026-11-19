// ============================================================================
// Persona 5 Royal Add-On System Rules Engine & Calculation Logic
// ============================================================================

import type { ArcanaId, CharacterPersona, PersonaSpell } from '../types/persona';
import type { Character } from '../types';
import { getDefaultPersonaStarterItems } from '../data/personaItems';
import {
  getDefaultPersonaStarterWeapons,
  DEFAULT_MELEE_WEAPON,
  DEFAULT_GUN_WEAPON,
} from '../data/personaWeapons';

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
 * Convert Battle Deck values back to standard sheet numbers (÷10, floored down)
 * e.g. 75 HP -> 7 HP on normal sheet
 */
export function fromBattleHp(battleHp: number): number {
  return Math.max(0, Math.floor((battleHp || 0) / 10));
}

export function fromBattleSp(battleSp: number): number {
  return Math.max(0, Math.floor((battleSp || 0) / 10));
}

/**
 * Sync Persona Battle Deck HP/SP changes back into standard sheet vitals (floor ÷ 10).
 * Keeps standard sheet values bounded within [0, max].
 */
export function syncPersonaToSheetVitals(
  char: Character,
  battleHp: number,
  battleSp: number
): void {
  if (!char.vitals) return;
  const maxPhys = char.vitals.physicalHpMax || 10;
  const maxComp = char.vitals.composureMax || 10;
  char.vitals.physicalHpCurrent = Math.min(maxPhys, fromBattleHp(battleHp));
  char.vitals.composureCurrent = Math.min(maxComp, fromBattleSp(battleSp));
}

export interface ParsedDiceExpression {
  count: number;
  sides: number;
  modifier: number;
  normalized: string; // e.g. "2d8"
}

/**
 * Parses dice strings like "d6", "1d8", "2d6 + 3", "3d10-1" into structured components.
 */
export function parseDiceExpression(expr: string, extraMod: number = 0): ParsedDiceExpression {
  const clean = (expr || '1d6').trim();
  const match = clean.match(/(\d*)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?/i);
  if (!match) {
    return { count: 1, sides: 20, modifier: extraMod, normalized: '1d20' };
  }
  const count = Math.max(1, parseInt(match[1] || '1', 10) || 1);
  const sides = Math.max(2, parseInt(match[2] || '6', 10) || 6);
  const sign = match[3] === '-' ? -1 : 1;
  const parsedMod = match[4] ? sign * parseInt(match[4], 10) : 0;
  return {
    count,
    sides,
    modifier: parsedMod + extraMod,
    normalized: `${count}d${sides}`,
  };
}

/**
 * Multiplies the dice count of a weapon/AOA expression (e.g. "1d6" × 4 shots -> "4d6").
 */
export function scaleDiceExpression(expr: string, multiplier: number): string {
  const parsed = parseDiceExpression(expr);
  const mult = Math.max(1, Math.floor(multiplier || 1));
  return `${parsed.count * mult}d${parsed.sides}`;
}

/**
 * Extracts dice expression & resolved modifier for a PersonaSpell using character STR/MAG.
 */
export function resolveSpellDamageSpec(
  spell: PersonaSpell,
  stats: { str: { mod: number }; mag: { mod: number } }
): { dice: string; mod: number; isHeal: boolean } | null {
  if (!spell.damageFormula) return null;
  const formula = spell.damageFormula;
  const diceMatch = formula.match(/(\d+)\s*×\s*\((\d*d\d+)/i);
  let baseDice: string | null = null;
  if (diceMatch) {
    const mult = parseInt(diceMatch[1], 10) || 1;
    baseDice = scaleDiceExpression(diceMatch[2], mult);
  } else {
    const simpleMatch = formula.match(/(\d*d\d+)/i);
    if (simpleMatch) {
      const parsed = parseDiceExpression(simpleMatch[1]);
      baseDice = parsed.normalized;
    }
  }
  if (!baseDice) return null;

  let mod = 0;
  if (/\bMAG\b/i.test(formula)) mod += stats.mag.mod;
  if (/\bSTR\b/i.test(formula)) mod += stats.str.mod;
  const flatMatch = formula.match(/([+-])\s*(\d+)(?!\s*d)/);
  if (flatMatch) {
    mod += (flatMatch[1] === '-' ? -1 : 1) * parseInt(flatMatch[2], 10);
  }

  return {
    dice: baseDice,
    mod,
    isHeal: spell.category === 'heal',
  };
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
    gunBullets: DEFAULT_GUN_WEAPON.maxBullets || DEFAULT_MAX_BULLETS,
    maxGunBullets: DEFAULT_GUN_WEAPON.maxBullets || DEFAULT_MAX_BULLETS,
    encounterActive: false,
    worldChosenStat,
    items: getDefaultPersonaStarterItems(),
    weapons: getDefaultPersonaStarterWeapons(),
    equippedMeleeId: DEFAULT_MELEE_WEAPON.id,
    equippedGunId: DEFAULT_GUN_WEAPON.id,
    activeEffects: [],
  };
}

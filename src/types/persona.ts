// ============================================================================
// Types for Persona 5 Royal Add-On System in Damsel & Desire
// ============================================================================

export type ArcanaId =
  | 'fool'
  | 'magician'
  | 'priestess'
  | 'empress'
  | 'emperor'
  | 'hierophant'
  | 'lovers'
  | 'chariot'
  | 'justice'
  | 'hermit'
  | 'fortune'
  | 'strength'
  | 'hangedman'
  | 'death'
  | 'temperance'
  | 'devil'
  | 'tower'
  | 'star'
  | 'moon'
  | 'sun'
  | 'judgement'
  | 'world';

export type ElementType =
  | 'physical'
  | 'gun'
  | 'fire'
  | 'ice'
  | 'electric'
  | 'wind'
  | 'psy'
  | 'nuclear'
  | 'bless'
  | 'curse'
  | 'almighty';

export type AffinityEffect = 'normal' | 'weak' | 'resist' | 'immune' | 'repel';

export interface ArcanaAffinityProgression {
  level3: { type: 'resist'; elements: ElementType[] };
  level5: { type: 'immune'; element: ElementType };
  level6: { type: 'resist'; element: ElementType };
}

export interface ArcanaInfo {
  id: ArcanaId;
  number: number;           // 0 to 21
  roman: string;            // '0', 'I', 'II', ..., 'XXI'
  name: string;             // "The Fool", "The Magician", etc.
  nameJp: string;           // 愚者, 魔術師, etc.
  primaryStat: 'physique' | 'intelligent' | 'looks' | 'mind' | 'talent' | 'luck';
  theme: string;
  signatureSpells: string[]; // 9 signature spell IDs (#1-#9)
  affinities: Partial<Record<ElementType, AffinityEffect>>;
  progression: ArcanaAffinityProgression;
}

export type SpellCategory = 'attack' | 'heal' | 'support' | 'ailment' | 'passive';
export type SpellActionType = 'action' | 'bonus_action' | 'reaction' | 'passive';

export interface PersonaSpell {
  id: string;
  name: string;
  nameJp?: string;
  element: ElementType;
  category: SpellCategory;
  actionType: SpellActionType;
  tier: 0 | 1 | 2 | 3 | 4 | 5 | 8; // 8 = Apex
  spCost: number;                  // Flat SP cost
  damageFormula?: string;          // e.g. "1d6 + STR" or "2d8 + MAG"
  range?: string;                  // e.g. "1 target (60 ft)", "Radius 15 ft"
  effect: string;                  // Mechanical description
  ailment?: string;                // e.g. "Burn", "Freeze", "Dazed"
  isSignature?: boolean;
  signatureArcana?: ArcanaId;
  signatureIndex?: number;         // 1 to 9
  arcanaAccess?: ArcanaId[] | 'universal'; // Who can equip it
  unlockLevel: number;             // Character level required (1-6)
  isApex?: boolean;                // Strain 2d6
}

// Stored in Supabase `characters.persona`
export interface CharacterPersona {
  isAwakened: boolean;
  awakeningLevel: 1 | 2;           // 1 = Initial (Lv 1-4), 2 = Second (Lv 5-6)
  arcanaId: ArcanaId;
  personaName: string;
  personaVisual?: string;          // Description of appearance / form
  personaImagePath?: string;       // Custom uploaded/selected image path
  equippedSpells: string[];        // Array of spell IDs currently carried
  currentSp: number;               // Live SP pool (Composure × 10)
  maxSp: number;                   // Max SP pool (ComposureMax × 10)
  currentHp: number;               // Mirrored Physical HP × 10
  maxHp: number;                   // Mirrored Physical HP Max × 10
  gunBullets: number;              // Current ammo in magazine
  maxGunBullets: number;           // Defaults to 8
  encounterActive: boolean;        // Track if currently in combat encounter
  worldChosenStat?: 'physique' | 'intelligent' | 'looks' | 'mind' | 'talent' | 'luck';
}

export type BattleCommand = 'attack' | 'gun' | 'persona' | 'item' | 'guard';

export interface BattleDeckState {
  isOpen: boolean;
  selectedCommand: BattleCommand | null;
  selectedSpellId: string | null;
  isGuarding: boolean;
  turnUsedFreeSpell: boolean;
}

export interface NpcPersonaPreset {
  id: string;
  characterName: string;
  arcanaId: ArcanaId;
  personaName: string;
  personaVisual: string;
  suggestedSpells: string[];
}

// ============================================================================
// Persona 5 Royal Official Battle Item Compendium — Damsel & Desire
// ============================================================================

import type { PersonaItemDef, PersonaItemCategory, PersonaInventoryEntry } from '../types/persona';

export const PERSONA_ITEM_CATEGORIES: Array<{
  id: PersonaItemCategory | 'all';
  label: string;
  badgeColor: string;
}> = [
  { id: 'all', label: 'SEMUA', badgeColor: '#ffffff' },
  { id: 'heal_hp', label: 'HP HEAL', badgeColor: '#2ecc71' },
  { id: 'heal_sp', label: 'SP RECOVERY', badgeColor: '#00f0ff' },
  { id: 'heal_both', label: 'HP + SP', badgeColor: '#ffe600' },
  { id: 'damage', label: 'ATTACK / DMG', badgeColor: '#e60012' },
  { id: 'buff', label: 'BUFF / SHIELD', badgeColor: '#a855f7' },
  { id: 'debuff', label: 'DEBUFF', badgeColor: '#f97316' },
  { id: 'cure', label: 'CURE', badgeColor: '#38bdf8' },
];

export const PERSONA_ITEM_CATALOG: PersonaItemDef[] = [
  // --- HP RECOVERY ---
  {
    id: 'p5_item_medicine',
    name: 'Medicine',
    category: 'heal_hp',
    hpRestore: 30,
    description: 'Obat standar Klinik Takemi. Memulihkan 30 HP seketika.',
  },
  {
    id: 'p5_item_ointment',
    name: 'Ointment',
    category: 'heal_hp',
    hpRestore: 50,
    description: 'Salep penyembuh pekat. Memulihkan 50 HP.',
  },
  {
    id: 'p5_item_life_stone',
    name: 'Life Stone',
    category: 'heal_hp',
    hpRestorePercent: 0.3,
    description: 'Batu spiritual Metaverse. Memulihkan 30% Max HP secara instan.',
  },
  {
    id: 'p5_item_takemedic_all',
    name: 'Takemedic-All Z',
    category: 'heal_hp',
    hpRestore: 100,
    description: 'Ramuan eksperimental Tae Takemi. Memulihkan 100 HP (Party/Self).',
  },
  {
    id: 'p5_item_bead',
    name: 'Bead',
    category: 'heal_hp',
    hpRestorePercent: 1,
    description: 'Permata penyembuh murni. Memulihkan 100% HP penuh.',
  },
  {
    id: 'p5_item_revival_bead',
    name: 'Revival Bead',
    category: 'heal_hp',
    hpRestorePercent: 0.5,
    description: 'Membangkitkan sekutu yang jatuh (0 HP) dengan 50% Max HP.',
  },
  {
    id: 'p5_item_balm_of_life',
    name: 'Balm of Life',
    category: 'heal_hp',
    hpRestorePercent: 1,
    description: 'Membangkitkan sekutu yang jatuh dengan 100% HP penuh.',
  },

  // --- SP RECOVERY ---
  {
    id: 'p5_item_soul_drop',
    name: 'Soul Drop',
    category: 'heal_sp',
    spRestore: 10,
    description: 'Tetesan spiritual ringan. Memulihkan 10 SP.',
  },
  {
    id: 'p5_item_leblanc_coffee',
    name: 'Leblanc Coffee',
    category: 'heal_sp',
    spRestore: 30,
    description: 'Kopi seduhan tangan Café Leblanc. Memulihkan 30 SP.',
  },
  {
    id: 'p5_item_snuff_soul',
    name: 'Snuff Soul',
    category: 'heal_sp',
    spRestore: 50,
    description: 'Bubuk aroma pemulih jiwa. Memulihkan 50 SP.',
  },
  {
    id: 'p5_item_master_coffee',
    name: 'Master Coffee',
    category: 'heal_sp',
    spRestore: 60,
    description: 'Racikan spesial Sojiro Sakura. Memulihkan 60 SP.',
  },
  {
    id: 'p5_item_chewing_soul',
    name: 'Chewing Soul',
    category: 'heal_sp',
    spRestore: 100,
    description: 'Permen spiritual langka. Memulihkan 100 SP.',
  },

  // --- HP + SP RECOVERY ---
  {
    id: 'p5_item_leblanc_curry',
    name: 'Leblanc Curry',
    category: 'heal_both',
    hpRestore: 30,
    spRestore: 30,
    description: 'Kari rahasia Café Leblanc. Memulihkan 30 HP & 30 SP.',
  },
  {
    id: 'p5_item_soma',
    name: 'Soma',
    category: 'heal_both',
    hpRestorePercent: 1,
    spRestorePercent: 1,
    description: 'Eliksir legendaris Phantom Thieves. Memulihkan 100% HP & 100% SP penuh!',
  },

  // --- ELEMENTAL ATTACK / DAMAGE ---
  {
    id: 'p5_item_molotov',
    name: 'Molotov Cocktail',
    category: 'damage',
    damageDice: '2d6',
    damageMod: 2,
    damageElement: 'fire',
    description: 'Bom api rakitan. Menimbulkan 2d6 + 2 Fire damage (1 target).',
  },
  {
    id: 'p5_item_freeze_spray',
    name: 'Freeze Spray',
    category: 'damage',
    damageDice: '2d6',
    damageMod: 2,
    damageElement: 'ice',
    description: 'Semprotan nitrogen beku. Menimbulkan 2d6 + 2 Ice damage.',
  },
  {
    id: 'p5_item_stun_gun',
    name: 'Stun Gun',
    category: 'damage',
    damageDice: '2d6',
    damageMod: 2,
    damageElement: 'electric',
    description: 'Kejutan listrik tegangan tinggi. Menimbulkan 2d6 + 2 Electric damage.',
  },
  {
    id: 'p5_item_air_cannon',
    name: 'Air Cannon',
    category: 'damage',
    damageDice: '2d6',
    damageMod: 2,
    damageElement: 'wind',
    description: 'Meriam tekanan angin. Menimbulkan 2d6 + 2 Wind damage.',
  },
  {
    id: 'p5_item_psy_bomb',
    name: 'Psy Bomb',
    category: 'damage',
    damageDice: '2d6',
    damageMod: 2,
    damageElement: 'psy',
    description: 'Granat gelombang psikis. Menimbulkan 2d6 + 2 Psy damage.',
  },
  {
    id: 'p5_item_nuke_magatama',
    name: 'Nuclear Magatama',
    category: 'damage',
    damageDice: '2d8',
    damageMod: 2,
    damageElement: 'nuclear',
    description: 'Magatama radiasi panas. Menimbulkan 2d8 + 2 Nuclear damage.',
  },
  {
    id: 'p5_item_bless_magatama',
    name: 'Bless Magatama',
    category: 'damage',
    damageDice: '2d8',
    damageMod: 2,
    damageElement: 'bless',
    description: 'Magatama cahaya suci. Menimbulkan 2d8 + 2 Bless damage.',
  },
  {
    id: 'p5_item_curse_magatama',
    name: 'Curse Magatama',
    category: 'damage',
    damageDice: '2d8',
    damageMod: 2,
    damageElement: 'curse',
    description: 'Magatama kutukan gelap. Menimbulkan 2d8 + 2 Curse damage.',
  },
  {
    id: 'p5_item_megido_bomb',
    name: 'Megido Bomb',
    category: 'damage',
    damageDice: '3d8',
    damageMod: 0,
    damageElement: 'almighty',
    description: 'Ledakan Almighty murni (menembus resistensi). 3d8 Almighty damage.',
  },

  // --- BUFF & SHIELD ---
  {
    id: 'p5_item_rasetsu_ofuda',
    name: 'Rasetsu Ofuda',
    category: 'buff',
    effectLabel: 'ATK UP (+2 Hit/Dmg • 3T)',
    durationTurns: 3,
    description: 'Jimat Tarukaja. Meningkatkan serangan (+2 To-Hit & Damage) selama 3 giliran.',
  },
  {
    id: 'p5_item_kongou_ofuda',
    name: 'Kongou Ofuda',
    category: 'buff',
    effectLabel: 'DEF UP (+2 AC • 3T)',
    durationTurns: 3,
    description: 'Jimat Rakukaja. Meningkatkan pertahanan (+2 AC & tahan damage) selama 3 giliran.',
  },
  {
    id: 'p5_item_idaten_ofuda',
    name: 'Idaten Ofuda',
    category: 'buff',
    effectLabel: 'AGI UP (Adv Refleks • 3T)',
    durationTurns: 3,
    description: 'Jimat Sukukaja. Advantage pada lemparan Refleks/Inisiatif selama 3 giliran.',
  },
  {
    id: 'p5_item_phys_ointment',
    name: 'Physical Ointment',
    category: 'buff',
    effectLabel: 'TETRAKARN (Repel Phys 1×)',
    durationTurns: 1,
    description: 'Memasang perisai Tetrakarn yang memantulkan 1 serangan Physical/Gun berikutnya.',
  },
  {
    id: 'p5_item_magic_ointment',
    name: 'Magic Ointment',
    category: 'buff',
    effectLabel: 'MAKARAKARN (Repel Magic 1×)',
    durationTurns: 1,
    description: 'Memasang perisai Makarakarn yang memantulkan 1 serangan Magic berikutnya.',
  },

  // --- DEBUFF ---
  {
    id: 'p5_item_tarunda_smoke',
    name: 'Tarunda Smoke',
    category: 'debuff',
    effectLabel: 'ENEMY ATK DOWN (−2 • 3T)',
    durationTurns: 3,
    description: 'Kabut pelemah serangan musuh (−2 Attack Roll & Damage lawan selama 3 giliran).',
  },
  {
    id: 'p5_item_marakunda_spray',
    name: 'Marakunda Spray',
    category: 'debuff',
    effectLabel: 'ENEMY DEF DOWN (−2 AC • 3T)',
    durationTurns: 3,
    description: 'Semprotan korosif pertahanan lawan (−2 AC musuh selama 3 giliran).',
  },
  {
    id: 'p5_item_sleep_vial',
    name: 'Sleep Vial',
    category: 'debuff',
    effectLabel: 'SLEEP VIAL (Target Mind DC 13)',
    durationTurns: 2,
    description: 'Botol gas tidur. Target wajib Mind Save DC 13 atau tertidur (Technical ready).',
  },
  {
    id: 'p5_item_confuse_vial',
    name: 'Confuse Vial',
    category: 'debuff',
    effectLabel: 'CONFUSE VIAL (Target Mind DC 13)',
    durationTurns: 2,
    description: 'Gas halusinasi. Target wajib Mind Save DC 13 atau mengalami Confuse.',
  },
  {
    id: 'p5_item_vanish_ball',
    name: 'Vanish Ball',
    category: 'debuff',
    effectLabel: 'SMOKE ESCAPE (Disengage)',
    durationTurns: 1,
    description: 'Bom asap Phantom Thieves untuk langsung mundur/Disengage aman dari pertempuran.',
  },

  // --- STATUS CURE ---
  {
    id: 'p5_item_relax_gel',
    name: 'Relax Gel',
    category: 'cure',
    effectLabel: 'MENTAL CLEAR',
    description: 'Menyembuhkan status mental: Despair, Fear, Rage, atau Brainwash.',
  },
  {
    id: 'p5_item_energy_drop',
    name: 'Energy Drop',
    category: 'cure',
    effectLabel: 'AWAKE CLEAR',
    description: 'Menyembuhkan status Confuse, Dizzy, Forget, atau Sleep.',
  },
  {
    id: 'p5_item_amrita_soda',
    name: 'Amrita Soda',
    category: 'cure',
    effectLabel: 'ALL AILMENTS CURED',
    description: 'Minuman pemurni instan. Menghapus seluruh status negatif (non-spesial).',
  },
];

export const PERSONA_ITEM_BY_ID = new Map<string, PersonaItemDef>(
  PERSONA_ITEM_CATALOG.map((item) => [item.id, item])
);

export function resolvePersonaItem(entry: PersonaInventoryEntry): PersonaItemDef | undefined {
  return entry.customItem || PERSONA_ITEM_BY_ID.get(entry.itemId);
}

/** Default starter bag for newly awakened Persona users */
export function getDefaultPersonaStarterItems(): PersonaInventoryEntry[] {
  return [
    { itemId: 'p5_item_medicine', qty: 3 },
    { itemId: 'p5_item_leblanc_coffee', qty: 2 },
    { itemId: 'p5_item_molotov', qty: 2 },
    { itemId: 'p5_item_rasetsu_ofuda', qty: 1 },
  ];
}

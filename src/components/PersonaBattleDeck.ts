// ============================================================================
// PersonaBattleDeck — Persona 5 Royal Style Battle Deck Component (v3)
// Features:
//  - Dedicated Persona Image Upload (never falls back to human avatar)
//  - Custom HP/SP Adjuster synced to Normal Sheet Vitals (Math.floor ÷ 10)
//  - Strict 1-Active Mutual Exclusion across 5 Radial Commands
//  - Contextual Drawers: Spells, Persona Inventory + P5 Catalog + Auto-Consume,
//    Sword/Gun Armory + Custom Weapon Builder, Multi-Bullet Burst Fire, Guard
//  - Specific Focused Action Dice Roller integration
// ============================================================================

import {
  toBattleHp,
  toBattleMaxHp,
  toBattleSp,
  toBattleMaxSp,
  fromBattleHp,
  fromBattleSp,
  syncPersonaToSheetVitals,
  calculatePersonaStats,
  getComposureState,
  getAvailableSignatureSpells,
  getProficiencyBonus,
  calculateAttackBonus,
  calculateSpellDC,
  scaleDiceExpression,
  resolveSpellDamageSpec,
  DEFAULT_MAX_BULLETS,
} from '../rules/personaRules';
import {
  MAJOR_ARCANA,
  ARCANA_BY_ID,
  SPELL_BY_ID,
  ELEMENT_METADATA,
} from '../data/personaData';
import {
  PERSONA_ITEM_CATALOG,
  PERSONA_ITEM_CATEGORIES,
  resolvePersonaItem,
  getDefaultPersonaStarterItems,
} from '../data/personaItems';
import {
  PERSONA_MELEE_CATALOG,
  PERSONA_GUN_CATALOG,
  DEFAULT_MELEE_WEAPON,
  DEFAULT_GUN_WEAPON,
  getDefaultPersonaStarterWeapons,
} from '../data/personaWeapons';
import { characterStore } from '../store/characterStore';
import { updateCharacterDirect } from '../api/characters';
import { uploadPersonaImage } from '../api/storage';
import { diceRollerModal } from './DiceRollerModal';
import { personaWizardModal } from './PersonaWizardModal';
import { personaTransitionOverlay } from './PersonaTransitionOverlay';
import { allOutAttackModal } from './AllOutAttackModal';
import { showToast } from './Toast';
import { renderPersonaAudioBadge, bindPersonaAudioBadge } from '../utils/personaAudio';
import type { Character } from '../types';
import type {
  ElementType,
  PersonaSpell,
  ArcanaInfo,
  BattleCommand,
  CharacterPersona,
  PersonaItemCategory,
  PersonaItemDef,
  PersonaWeaponDef,
  PersonaWeaponKind,
} from '../types/persona';

// Single Source of Truth for Active Command (Mutual Exclusion — ONLY 1 active!)
let selectedBattleCommand: BattleCommand | null = 'persona';
let turnUsedFreeSpell = false;
let unbindDeckAudioBadge: (() => void) | null = null;

// Sub-UI state inside drawers
let activeItemCategoryFilter: PersonaItemCategory | 'all' = 'all';
let isItemCatalogOpen = false;
let itemCatalogCategory: PersonaItemCategory | 'all' = 'all';
let isArmoryOpen = false;
let armorySubTab: 'owned' | 'catalog' | 'custom' = 'owned';
let selectedGunShotCount = 1;

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Ensures older Persona records saved before v3 seamlessly get starter items & weapons.
 */
function ensurePersonaLoadout(pData: CharacterPersona): void {
  if (!Array.isArray(pData.items)) {
    pData.items = getDefaultPersonaStarterItems();
  }
  if (!Array.isArray(pData.weapons) || pData.weapons.length === 0) {
    pData.weapons = getDefaultPersonaStarterWeapons();
  }
  if (!pData.equippedMeleeId) {
    const firstMelee = pData.weapons.find((w) => w.kind === 'melee') || DEFAULT_MELEE_WEAPON;
    pData.equippedMeleeId = firstMelee.id;
  }
  if (!pData.equippedGunId) {
    const firstGun = pData.weapons.find((w) => w.kind === 'gun') || DEFAULT_GUN_WEAPON;
    pData.equippedGunId = firstGun.id;
  }
  if (!Array.isArray(pData.activeEffects)) {
    pData.activeEffects = [];
  }
}

function getEquippedWeapon(pData: CharacterPersona, kind: PersonaWeaponKind): PersonaWeaponDef {
  ensurePersonaLoadout(pData);
  const targetId = kind === 'melee' ? pData.equippedMeleeId : pData.equippedGunId;
  const owned = (pData.weapons || []).find((w) => w.id === targetId && w.kind === kind);
  if (owned) return owned;
  const fallbackOwned = (pData.weapons || []).find((w) => w.kind === kind);
  if (fallbackOwned) return fallbackOwned;
  return kind === 'melee' ? DEFAULT_MELEE_WEAPON : DEFAULT_GUN_WEAPON;
}

function getCategoryBadgeLabel(cat: PersonaItemCategory): string {
  const found = PERSONA_ITEM_CATEGORIES.find((c) => c.id === cat);
  return found ? found.label : cat.toUpperCase();
}

function getCategoryColor(cat: PersonaItemCategory): string {
  const found = PERSONA_ITEM_CATEGORIES.find((c) => c.id === cat);
  return found ? found.badgeColor : '#ffffff';
}

export function resetPersonaBattleDeckState(): void {
  selectedBattleCommand = 'persona';
  turnUsedFreeSpell = false;
  isItemCatalogOpen = false;
  isArmoryOpen = false;
  selectedGunShotCount = 1;
}

export function renderPersonaBattleDeck(char: Character): string {
  // 1. If character is not awakened yet, render Awakening Callout Card
  if (!char.persona || !char.persona.isAwakened) {
    return `
      <div class="persona-p5-scope" style="text-align:center;padding:3rem 1.5rem;">
        <div style="font-family:var(--p5-font-display);font-size:3rem;color:var(--p5-red);text-shadow:3px 3px 0px #000;margin-bottom:0.5rem;">
          WAKE UP, GET UP, GET OUT THERE!
        </div>
        <p style="max-width:600px;margin:0 auto 1.5rem auto;font-size:1rem;color:var(--p5-light-gray);line-height:1.5;">
          Jiwa pemberontak di dalam dirimu belum dibangkitkan. Jalani upacara pemanggilan Persona untuk membuka seluruh dek sihir, kekuatan atribut Arcana, dan perintah tempur Phantom Thieves!
        </p>
        <button type="button" class="p5-aoa-trigger-btn" id="p5DeckAwakenPromptBtn" style="font-size:1.4rem;padding:0.75rem 2rem;">
          BREAK THE MASK // AWAKEN PERSONA
        </button>
      </div>
    `;
  }

  const pData = char.persona;
  ensurePersonaLoadout(pData);

  const arcana: ArcanaInfo = ARCANA_BY_ID.get(pData.arcanaId) || MAJOR_ARCANA[0];
  const level = Math.max(1, Math.min(6, char.level || 1));
  const pb = getProficiencyBonus(level);
  const stats = calculatePersonaStats(char, pData.arcanaId, pData.worldChosenStat);

  // Vitals calculation (×10)
  const maxHp = toBattleMaxHp(char.vitals?.physicalHpMax || 10);
  const currentHp = Math.max(
    0,
    Math.min(maxHp, pData.currentHp !== undefined ? pData.currentHp : toBattleHp(char.vitals?.physicalHpCurrent || 10))
  );
  const maxSp = toBattleMaxSp(char.vitals?.composureMax || 10);
  const currentSp = Math.max(
    0,
    Math.min(maxSp, pData.currentSp !== undefined ? pData.currentSp : toBattleSp(char.vitals?.composureCurrent || 10))
  );
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const spPercent = Math.max(0, Math.min(100, Math.round((currentSp / maxSp) * 100)));

  const equippedMelee = getEquippedWeapon(pData, 'melee');
  const equippedGun = getEquippedWeapon(pData, 'gun');
  const maxBullets = equippedGun.maxBullets || pData.maxGunBullets || DEFAULT_MAX_BULLETS;
  const bullets = Math.max(0, Math.min(maxBullets, pData.gunBullets !== undefined ? pData.gunBullets : maxBullets));
  if (selectedGunShotCount > bullets) {
    selectedGunShotCount = Math.max(1, bullets);
  }

  const composureState = getComposureState(currentSp, maxSp);
  const isGuarding = selectedBattleCommand === 'guard';

  // Unlocked Signature Spells + Equipped Spells
  const signatureIndices = getAvailableSignatureSpells(level);
  const activeSpellIds = new Set<string>();
  signatureIndices.forEach((idx) => {
    if (arcana.signatureSpells[idx]) activeSpellIds.add(arcana.signatureSpells[idx]);
  });
  (pData.equippedSpells || []).forEach((id) => activeSpellIds.add(id));

  const spellsToDisplay: PersonaSpell[] = [];
  activeSpellIds.forEach((id) => {
    const sp = SPELL_BY_ID.get(id);
    if (sp) spellsToDisplay.push(sp);
  });

  const elements: ElementType[] = [
    'physical', 'gun', 'fire', 'ice', 'electric',
    'wind', 'psy', 'nuclear', 'bless', 'curse', 'almighty',
  ];

  return `
    <div class="persona-p5-scope" id="personaBattleDeckContainer">
      <!-- 1. DECK HEADER & INTERACTIVE VITALS (HP/SP × 10 SYNCED TO NORMAL SHEET) -->
      <div class="p5-deck-header">
        <div class="p5-deck-title-area">
          <span class="p5-deck-badge">${arcana.roman} ${arcana.name.toUpperCase()}</span>
          <div>
            <div style="font-family:var(--p5-font-display);font-size:1.6rem;color:#fff;line-height:1;">
              ${escapeHtml(char.name)} // ${escapeHtml(pData.personaName.toUpperCase())}
            </div>
            <div class="p5-deck-sub">
              LEVEL ${level} // PROFICIENCY +${pb} // ${pData.awakeningLevel === 2 ? 'SECOND AWAKENING' : 'INITIAL AWAKENING'}
            </div>
            <div style="margin-top:0.55rem;">
              ${renderPersonaAudioBadge('p5DeckAudioBadge')}
            </div>
          </div>
        </div>

        <div class="p5-vitals-container">
          <!-- HP Card with Custom Damage / Heal Adjuster -->
          <div class="p5-vital-card p5-vital-interactive">
            <div class="p5-vital-label-row">
              <span class="p5-vital-name hp-label">HP</span>
              <span class="p5-vital-nums" id="p5HpNums">${currentHp} / ${maxHp}</span>
            </div>
            <div class="p5-bar-track">
              <div class="p5-bar-fill-hp" id="p5HpBarFill" style="width: ${hpPercent}%"></div>
            </div>
            <div class="p5-vital-sync-hint">Sheet Normal: ${fromBattleHp(currentHp)} / ${char.vitals?.physicalHpMax || 10} HP (⌊÷10⌋)</div>
            <div class="p5-vital-adjust-row">
              <button type="button" class="p5-vadj-btn p5-vadj-minus" id="p5HpMinusBtn" title="Kurangi HP (Kena Damage)">− DMG</button>
              <input type="number" id="p5HpAdjustInput" class="p5-vadj-input" value="10" min="1" max="${maxHp}" aria-label="Jumlah perubahan HP" />
              <button type="button" class="p5-vadj-btn p5-vadj-plus" id="p5HpPlusBtn" title="Tambah HP (Heal)">+ HEAL</button>
              <button type="button" class="p5-vadj-btn p5-vadj-full" id="p5HpFullBtn" title="Pulihkan HP Penuh">MAX</button>
            </div>
          </div>

          <!-- SP Card with Custom Spend / Recover Adjuster -->
          <div class="p5-vital-card p5-vital-interactive">
            <div class="p5-vital-label-row">
              <span class="p5-vital-name sp-label">SP</span>
              <span class="p5-vital-nums" id="p5SpNums">${currentSp} / ${maxSp}</span>
            </div>
            <div class="p5-bar-track">
              <div class="p5-bar-fill-sp" id="p5SpBarFill" style="width: ${spPercent}%"></div>
            </div>
            <div class="p5-vital-sync-hint">Sheet Normal: ${fromBattleSp(currentSp)} / ${char.vitals?.composureMax || 10} Comp (⌊÷10⌋)</div>
            <div class="p5-vital-adjust-row">
              <button type="button" class="p5-vadj-btn p5-vadj-minus" id="p5SpMinusBtn" title="Kurangi SP">− SP</button>
              <input type="number" id="p5SpAdjustInput" class="p5-vadj-input" value="10" min="1" max="${maxSp}" aria-label="Jumlah perubahan SP" />
              <button type="button" class="p5-vadj-btn p5-vadj-plus" id="p5SpPlusBtn" title="Pulihkan SP">+ SP</button>
              <button type="button" class="p5-vadj-btn p5-vadj-full" id="p5SpFullBtn" title="Pulihkan SP Penuh">MAX</button>
            </div>
            <!-- Composure State Badge -->
            <div class="p5-state-indicator ${
              composureState === 'steady'
                ? 'p5-state-steady'
                : composureState === 'salting'
                ? 'p5-state-salting'
                : 'p5-state-meltdown'
            }" id="p5ComposureStateBadge">
              ${
                composureState === 'steady'
                  ? 'STEADY (>50%)'
                  : composureState === 'salting'
                  ? 'SALTING (SURGE READY)'
                  : 'MELTDOWN (LUMPUH)'
              }
            </div>
          </div>
        </div>
      </div>

      ${(pData.activeEffects && pData.activeEffects.length > 0) ? `
        <div class="p5-active-effects-bar" aria-label="Efek Buff & Debuff Aktif">
          <span class="p5-effects-prefix">ACTIVE EFFECTS:</span>
          ${pData.activeEffects.map((ef) => `
            <span class="p5-effect-pill effect-${ef.type}">
              <span>${escapeHtml(ef.label)}</span>
              <button type="button" class="p5-effect-dismiss" data-effect-id="${escapeHtml(ef.id)}" aria-label="Hapus efek">&times;</button>
            </span>
          `).join('')}
        </div>
      ` : ''}

      <!-- 2. PERSONA ID (DEDICATED PERSONA IMAGE UPLOAD) & STATS CENTER GRID -->
      <div class="p5-center-grid">
        <!-- Persona ID Card -->
        <div class="p5-persona-id-card">
          <div class="p5-persona-img-box ${pData.personaImagePath ? 'has-persona-img' : 'empty-persona-img'}" id="p5PersonaPhotoBox" role="button" tabindex="0" title="Klik untuk mengunggah atau mengganti foto wujud Persona">
            ${
              pData.personaImagePath
                ? `
                  <img src="${escapeHtml(pData.personaImagePath)}" alt="Persona ${escapeHtml(pData.personaName)}" id="p5PersonaArtImg" />
                  <div class="p5-persona-img-overlay">
                    <span>GANTI FOTO PERSONA</span>
                  </div>
                `
                : `
                  <div class="p5-persona-upload-empty">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span class="p5-upload-title">UNGGAH FOTO PERSONA</span>
                    <span class="p5-upload-sub">Klik untuk memasang ilustrasi ${escapeHtml(pData.personaName)}</span>
                  </div>
                `
            }
            <div class="p5-persona-img-loading" id="p5PersonaImgLoading" style="display:none;">
              <span>MENGUNGGAH...</span>
            </div>
          </div>

          <input type="file" id="p5PersonaPhotoInput" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;" />

          <div class="p5-persona-photo-actions">
            <button type="button" class="p5-photo-btn" id="p5UploadPersonaPhotoBtn">
              ${pData.personaImagePath ? 'GANTI FOTO' : 'UNGGAH FOTO'}
            </button>
            ${pData.personaImagePath ? `
              <button type="button" class="p5-photo-btn p5-photo-btn-ghost" id="p5RemovePersonaPhotoBtn">
                HAPUS
              </button>
            ` : ''}
          </div>

          <div class="p5-persona-arcana-ribbon">${arcana.name} [${arcana.nameJp}]</div>
          <div class="p5-persona-name-banner">${escapeHtml(pData.personaName)}</div>
          <div class="p5-persona-flavor">
            "${escapeHtml(pData.personaVisual || arcana.theme)}"
          </div>
        </div>

        <!-- Stats & Affinities Column -->
        <div>
          <!-- Stats Trio -->
          <div class="p5-stats-trio">
            <div class="p5-stat-card">
              <span class="p5-stat-title">STR (PHY)</span>
              <span class="p5-stat-value">${stats.str.score}</span>
              <span class="p5-stat-mod">MOD: ${formatMod(stats.str.mod)} // ATK: +${calculateAttackBonus(stats.str.mod, pb)}</span>
            </div>
            <div class="p5-stat-card">
              <span class="p5-stat-title">MAG (${arcana.primaryStat.slice(0, 3).toUpperCase()})</span>
              <span class="p5-stat-value">${stats.mag.score}</span>
              <span class="p5-stat-mod">MOD: ${formatMod(stats.mag.mod)} // DC: ${calculateSpellDC(pb, stats.mag.mod)}</span>
            </div>
            <div class="p5-stat-card">
              <span class="p5-stat-title">END (MIND)</span>
              <span class="p5-stat-value">${stats.end.score}</span>
              <span class="p5-stat-mod">MOD: ${formatMod(stats.end.mod)} // DAMPENER</span>
            </div>
          </div>

          <!-- Equipped Loadout Quick Strip -->
          <div class="p5-loadout-strip">
            <div class="p5-loadout-chip">
              <span class="p5-loadout-tag">SWORD</span>
              <span class="p5-loadout-name">${escapeHtml(equippedMelee.name)}</span>
              <span class="p5-loadout-stat">${equippedMelee.damageDice}${equippedMelee.damageBonus ? formatMod(equippedMelee.damageBonus) : ''}</span>
            </div>
            <div class="p5-loadout-chip">
              <span class="p5-loadout-tag">GUN</span>
              <span class="p5-loadout-name">${escapeHtml(equippedGun.name)}</span>
              <span class="p5-loadout-stat">${equippedGun.damageDice} • ${bullets}/${maxBullets}</span>
            </div>
          </div>

          <!-- Affinities Panel -->
          <div class="p5-affinities-panel">
            <div class="p5-affinities-title">ELEMENTAL AFFINITIES &amp; RESISTANCES</div>
            <div class="p5-affinities-grid">
              ${elements.map((elem) => {
                const meta = ELEMENT_METADATA[elem];
                let tag = '-';
                let tagClass = 'tag-normal';

                if (level >= 3 && arcana.progression.level3.elements.includes(elem)) {
                  tag = 'RES';
                  tagClass = 'tag-resist';
                }
                if (level >= 5 && arcana.progression.level5.element === elem) {
                  tag = 'IMM';
                  tagClass = 'tag-immune';
                }
                if (level >= 6 && arcana.progression.level6.element === elem) {
                  tag = 'RES';
                  tagClass = 'tag-resist';
                }

                return `
                  <div class="p5-affinity-slot">
                    <span class="p5-aff-icon">${meta.icon}</span>
                    <span class="p5-aff-name">${elem.slice(0, 4)}</span>
                    <span class="p5-aff-tag ${tagClass}">${tag}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 3. P5R AUTHENTIC RADIAL WEDGE COMMAND MENU (STRICT 1-ACTIVE MUTEX) -->
      <div class="p5-battle-section">
        <div class="p5-section-title">COMMAND MENU // PILIH 1 AKSI BERTARUNG</div>

        <div class="p5-radial-command-stage" role="group" aria-label="Persona Battle Command Menu">
          <!-- Left Wing: GUN -->
          <div class="p5-radial-wing p5-radial-wing-left">
            <div class="p5-wedge-slot p5-slot-gun">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-gun ${selectedBattleCommand === 'gun' ? 'selected' : ''}" data-cmd="gun" aria-pressed="${selectedBattleCommand === 'gun'}" aria-label="Gun Attack">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-label">G<span class="p5-invert-letter">U</span>N</span>
                  <span class="p5-wedge-symbol p5-sym-gun" aria-hidden="true">⌖</span>
                  <span class="p5-wedge-ammo" id="p5BulletBadge">${bullets}/${maxBullets}</span>
                </span>
              </button>
            </div>
          </div>

          <!-- Center Pivot Accent -->
          <div class="p5-radial-pivot" aria-hidden="true">
            <span class="p5-pivot-core"></span>
          </div>

          <!-- Right Wing Fan: PERSONA, ITEM, SWORD, GUARD -->
          <div class="p5-radial-wing p5-radial-wing-right">
            <div class="p5-wedge-slot p5-slot-persona">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-persona ${selectedBattleCommand === 'persona' ? 'selected' : ''}" data-cmd="persona" aria-pressed="${selectedBattleCommand === 'persona'}" aria-label="Persona Skills">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-triangle" aria-hidden="true">△</span>
                  <span class="p5-wedge-label">PERSO<span class="p5-invert-letter">N</span>A</span>
                </span>
              </button>
            </div>

            <div class="p5-wedge-slot p5-slot-item">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-item ${selectedBattleCommand === 'item' ? 'selected' : ''}" data-cmd="item" aria-pressed="${selectedBattleCommand === 'item'}" aria-label="Persona Battle Items">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-square" aria-hidden="true">□</span>
                  <span class="p5-wedge-label">I<span class="p5-invert-letter">T</span>EM</span>
                </span>
              </button>
            </div>

            <div class="p5-wedge-slot p5-slot-sword">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-sword ${selectedBattleCommand === 'attack' ? 'selected' : ''}" data-cmd="attack" aria-pressed="${selectedBattleCommand === 'attack'}" aria-label="Sword Melee Attack">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-circle" aria-hidden="true">○</span>
                  <span class="p5-wedge-label">SW<span class="p5-invert-letter">O</span>RD</span>
                </span>
              </button>
            </div>

            <div class="p5-wedge-slot p5-slot-guard">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-guard ${isGuarding ? 'selected' : ''}" data-cmd="guard" aria-pressed="${isGuarding}" aria-label="Guard Stance">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-cross" aria-hidden="true">✕</span>
                  <span class="p5-wedge-label">${isGuarding ? 'G<span class="p5-invert-letter">U</span>ARDING' : 'G<span class="p5-invert-letter">U</span>ARD'}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. SINGLE CONTEXTUAL ACTION DRAWER (MATCHES SELECTED COMMAND) -->
        ${renderActiveCommandDrawer({
          char,
          pData,
          stats,
          pb,
          currentSp,
          maxSp,
          composureState,
          spellsToDisplay,
          equippedMelee,
          equippedGun,
          bullets,
          maxBullets,
        })}

        <!-- 5. ENCOUNTER CONTROL BAR -->
        <div class="p5-encounter-bar">
          <div class="p5-encounter-btn-group">
            <button type="button" class="p5-encounter-btn" id="p5ResetEncounterBtn">
              RESET ENCOUNTER (RELOAD ${maxBullets}/${maxBullets})
            </button>
            <button type="button" class="p5-encounter-btn" id="p5RestSpRecoverBtn">
              SHORT REST (RECOVER TIER 0)
            </button>
          </div>

          <button type="button" class="p5-aoa-trigger-btn" id="p5TriggerAoaBtn">
            ALL-OUT ATTACK (NAT 20)
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderActiveCommandDrawer(ctx: {
  char: Character;
  pData: CharacterPersona;
  stats: ReturnType<typeof calculatePersonaStats>;
  pb: number;
  currentSp: number;
  maxSp: number;
  composureState: 'steady' | 'salting' | 'meltdown';
  spellsToDisplay: PersonaSpell[];
  equippedMelee: PersonaWeaponDef;
  equippedGun: PersonaWeaponDef;
  bullets: number;
  maxBullets: number;
}): string {
  if (!selectedBattleCommand) return '';

  const { pData, stats, pb, currentSp, maxSp, composureState, spellsToDisplay, equippedMelee, equippedGun, bullets, maxBullets } = ctx;

  // --- A. PERSONA SPELL DECK DRAWER ---
  if (selectedBattleCommand === 'persona') {
    return `
      <div class="p5-skills-drawer" id="p5SkillsDrawer">
        <div class="p5-drawer-header">
          <div class="p5-drawer-title">SPELL DECK // JURUS PERSONA TERSEDIA</div>
          <div class="p5-sp-budget">CURRENT SP: ${currentSp} / ${maxSp}</div>
        </div>

        <div class="p5-skills-grid">
          ${spellsToDisplay.map((sp) => {
            const meta = ELEMENT_METADATA[sp.element];
            const isFree = sp.tier === 0 && !turnUsedFreeSpell;
            const effectiveCost = isFree ? 0 : sp.spCost;
            const canCast = currentSp >= effectiveCost && composureState !== 'meltdown';

            return `
              <div class="p5-skill-card" data-spell-id="${sp.id}">
                <div class="p5-skill-top">
                  <span class="p5-skill-name">
                    <span>${meta.icon}</span>
                    <span>${escapeHtml(sp.name)}</span>
                  </span>
                  <span class="p5-sp-cost-chip ${isFree ? 'cost-free' : ''}">
                    ${isFree ? 'FREE (1st)' : `${sp.spCost} SP`}
                  </span>
                </div>
                <div class="p5-skill-desc">${escapeHtml(sp.effect)}</div>
                <div class="p5-skill-action-row">
                  <span>${sp.actionType.toUpperCase().replace('_', ' ')} // ${escapeHtml(sp.damageFormula || sp.range || 'Support')}</span>
                  <button type="button" class="p5-cast-btn p5-cast-spell-btn" data-spell-id="${sp.id}" ${canCast ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"'}>
                    CAST ➔
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // --- B. PERSONA INVENTORY BAG + CATALOG DRAWER ---
  if (selectedBattleCommand === 'item') {
    const ownedEntries = (pData.items || []).filter((e) => e.qty > 0);
    const filteredOwned = ownedEntries.filter((entry) => {
      const def = resolvePersonaItem(entry);
      if (!def) return false;
      return activeItemCategoryFilter === 'all' || def.category === activeItemCategoryFilter;
    });

    const filteredCatalog = PERSONA_ITEM_CATALOG.filter(
      (it) => itemCatalogCategory === 'all' || it.category === itemCatalogCategory
    );

    return `
      <div class="p5-skills-drawer p5-inventory-drawer" id="p5InventoryDrawer">
        <div class="p5-drawer-header" style="flex-wrap:wrap;gap:0.75rem;">
          <div class="p5-drawer-title">PERSONA ITEM BAG // TAS PERTEMPURAN</div>
          <button type="button" class="p5-aoa-trigger-btn" id="p5ToggleItemCatalogBtn" style="font-size:0.95rem;padding:0.4rem 1rem;">
            ${isItemCatalogOpen ? 'TUTUP KATALOG ITEM' : '+ TAMBAH ITEM DARI KATALOG'}
          </button>
        </div>

        ${isItemCatalogOpen ? `
          <div class="p5-subpanel-box" id="p5ItemCatalogPanel">
            <div class="p5-subpanel-title">KATALOG ITEM RESMI PERSONA 5 ROYAL</div>
            <div class="p5-filter-pills">
              ${PERSONA_ITEM_CATEGORIES.map((c) => `
                <button type="button" class="p5-filter-pill ${itemCatalogCategory === c.id ? 'active' : ''}" data-catalog-cat="${c.id}">
                  ${c.label}
                </button>
              `).join('')}
            </div>

            <div class="p5-catalog-grid">
              ${filteredCatalog.map((it) => `
                <div class="p5-catalog-card">
                  <div class="p5-catalog-card-top">
                    <strong class="p5-catalog-name">${escapeHtml(it.name)}</strong>
                    <span class="p5-cat-tag" style="border-color:${getCategoryColor(it.category)};color:${getCategoryColor(it.category)};">
                      ${getCategoryBadgeLabel(it.category)}
                    </span>
                  </div>
                  <p class="p5-catalog-desc">${escapeHtml(it.description)}</p>
                  <div class="p5-catalog-actions">
                    <button type="button" class="p5-mini-add-btn" data-add-item-id="${it.id}" data-add-qty="1">+1</button>
                    <button type="button" class="p5-mini-add-btn" data-add-item-id="${it.id}" data-add-qty="3">+3</button>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Custom Item Quick Creator -->
            <div class="p5-custom-builder-box">
              <div class="p5-subpanel-subtitle">ATAU BUAT ITEM CUSTOM</div>
              <div class="p5-custom-form-grid">
                <input type="text" id="p5CustomItemName" class="p5-form-input" placeholder="Nama item (misal: Matcha Parfait)" maxlength="40" />
                <select id="p5CustomItemCat" class="p5-form-input">
                  <option value="heal_hp">HP Heal</option>
                  <option value="heal_sp">SP Recovery</option>
                  <option value="heal_both">HP + SP</option>
                  <option value="damage">Damage / Attack</option>
                  <option value="buff">Buff / Shield</option>
                  <option value="debuff">Debuff</option>
                  <option value="cure">Cure Ailment</option>
                </select>
                <input type="text" id="p5CustomItemValue" class="p5-form-input" placeholder="Nilai (HP/SP angka mis. 40, atau dadu 2d6+2)" />
                <input type="number" id="p5CustomItemQty" class="p5-form-input" value="1" min="1" max="99" title="Jumlah stok" />
              </div>
              <div style="display:flex;gap:0.6rem;margin-top:0.6rem;flex-wrap:wrap;">
                <input type="text" id="p5CustomItemDesc" class="p5-form-input" style="flex:1;min-width:200px;" placeholder="Deskripsi singkat efek item..." />
                <button type="button" class="p5-cast-btn" id="p5CreateCustomItemBtn" style="padding:0.5rem 1.1rem;font-size:1rem;">
                  SIMPAN KE TAS
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Bag Category Filter -->
        <div class="p5-filter-pills">
          ${PERSONA_ITEM_CATEGORIES.map((c) => `
            <button type="button" class="p5-filter-pill ${activeItemCategoryFilter === c.id ? 'active' : ''}" data-bag-cat="${c.id}">
              ${c.label}
            </button>
          `).join('')}
        </div>

        ${filteredOwned.length === 0 ? `
          <div class="p5-empty-bag-box">
            Tas item kategori ini kosong. Klik <strong>+ TAMBAH ITEM DARI KATALOG</strong> di atas untuk mengisi perlengkapan Persona 5!
          </div>
        ` : `
          <div class="p5-skills-grid">
            ${filteredOwned.map((entry) => {
              const def = resolvePersonaItem(entry)!;
              return `
                <div class="p5-skill-card p5-item-card">
                  <div class="p5-skill-top">
                    <span class="p5-skill-name">
                      <span class="p5-cat-dot" style="background:${getCategoryColor(def.category)};"></span>
                      <span>${escapeHtml(def.name)}</span>
                    </span>
                    <span class="p5-qty-chip">×${entry.qty}</span>
                  </div>
                  <div class="p5-skill-desc">${escapeHtml(def.description)}</div>
                  <div class="p5-skill-action-row">
                    <span style="color:${getCategoryColor(def.category)};font-weight:700;">${getCategoryBadgeLabel(def.category)}</span>
                    <div style="display:flex;gap:6px;align-items:center;">
                      <button type="button" class="p5-qty-step-btn" data-inc-item="${escapeHtml(entry.itemId)}" title="Tambah stok 1">+1</button>
                      <button type="button" class="p5-cast-btn p5-use-item-btn" data-use-item="${escapeHtml(entry.itemId)}">
                        PAKAI ➔
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  }

  // --- C. SWORD (MELEE WEAPON) DRAWER + ARMORY ---
  if (selectedBattleCommand === 'attack') {
    const toHitMod = calculateAttackBonus(stats.str.mod, pb) + equippedMelee.toHitBonus;
    const dmgMod = stats.str.mod + equippedMelee.damageBonus;

    return `
      <div class="p5-skills-drawer p5-weapon-drawer" id="p5SwordDrawer">
        <div class="p5-drawer-header" style="flex-wrap:wrap;gap:0.75rem;">
          <div class="p5-drawer-title">SWORD // SERANGAN MELEE SENJATA</div>
          <button type="button" class="p5-encounter-btn" id="p5ToggleArmoryBtn" data-armory-kind="melee" style="font-size:0.95rem;padding:0.35rem 0.9rem;">
            ${isArmoryOpen ? 'TUTUP ARMORY' : 'ARMORY // GANTI & BUAT SWORD'}
          </button>
        </div>

        <div class="p5-equipped-weapon-hero">
          <div class="p5-weapon-hero-info">
            <div class="p5-weapon-origin">${escapeHtml(equippedMelee.origin || 'EQUIPPED MELEE')}</div>
            <div class="p5-weapon-hero-name">${escapeHtml(equippedMelee.name)}</div>
            <div class="p5-weapon-hero-stats">
              <span class="p5-wstat-pill">TO HIT: <strong>1d20 ${formatMod(toHitMod)}</strong></span>
              <span class="p5-wstat-pill">DAMAGE: <strong>${escapeHtml(equippedMelee.damageDice)}${dmgMod ? ' ' + formatMod(dmgMod) : ''}</strong></span>
              <span class="p5-wstat-pill">CRIT: <strong>${equippedMelee.critRange === 19 ? '19–20' : '20'}</strong></span>
            </div>
            ${equippedMelee.notes ? `<p class="p5-weapon-notes">${escapeHtml(equippedMelee.notes)}</p>` : ''}
          </div>
          <div class="p5-weapon-hero-cta">
            <button type="button" class="p5-aoa-trigger-btn" id="p5ExecuteSwordAttackBtn" style="font-size:1.25rem;padding:0.75rem 1.6rem;">
              SERANG DENGAN ${escapeHtml(equippedMelee.name.toUpperCase())}
            </button>
          </div>
        </div>

        ${isArmoryOpen ? renderWeaponArmoryPanel(pData, 'melee') : ''}
      </div>
    `;
  }

  // --- D. GUN (FIREARM + MULTI-BULLET BURST FIRE) DRAWER + ARMORY ---
  if (selectedBattleCommand === 'gun') {
    const toHitMod = calculateAttackBonus(stats.str.mod, pb) + equippedGun.toHitBonus;
    const shots = Math.max(1, Math.min(Math.max(1, bullets), selectedGunShotCount));
    const burstDice = scaleDiceExpression(equippedGun.damageDice, shots);
    const burstDmgMod = stats.str.mod + equippedGun.damageBonus * shots;
    const halfMag = Math.max(1, Math.ceil(bullets / 2));

    const pipsHtml = Array.from({ length: maxBullets }, (_, idx) => {
      const isFilled = idx < bullets;
      const isQueued = isFilled && idx >= bullets - shots;
      return `<span class="p5-bullet-pip ${isFilled ? 'filled' : 'empty'} ${isQueued ? 'queued' : ''}" title="Peluru ${idx + 1}"></span>`;
    }).join('');

    return `
      <div class="p5-skills-drawer p5-weapon-drawer" id="p5GunDrawer">
        <div class="p5-drawer-header" style="flex-wrap:wrap;gap:0.75rem;">
          <div class="p5-drawer-title">GUN // TEMBAKAN BERUNTUN (MULTI-BULLET)</div>
          <button type="button" class="p5-encounter-btn" id="p5ToggleArmoryBtn" data-armory-kind="gun" style="font-size:0.95rem;padding:0.35rem 0.9rem;">
            ${isArmoryOpen ? 'TUTUP ARMORY' : 'ARMORY // GANTI & BUAT GUN'}
          </button>
        </div>

        <div class="p5-equipped-weapon-hero p5-gun-hero">
          <div class="p5-weapon-hero-info">
            <div class="p5-weapon-origin">${escapeHtml(equippedGun.origin || 'EQUIPPED FIREARM')}</div>
            <div class="p5-weapon-hero-name">${escapeHtml(equippedGun.name)}</div>
            <div class="p5-weapon-hero-stats">
              <span class="p5-wstat-pill">TO HIT: <strong>1d20 ${formatMod(toHitMod)}</strong></span>
              <span class="p5-wstat-pill">PER SHOT: <strong>${escapeHtml(equippedGun.damageDice)}${equippedGun.damageBonus ? ' ' + formatMod(equippedGun.damageBonus) : ''}</strong></span>
              <span class="p5-wstat-pill">MAGAZINE: <strong>${bullets} / ${maxBullets}</strong></span>
            </div>
            <div class="p5-bullet-chamber-row" aria-label="Amunisi tersisa ${bullets} dari ${maxBullets}">
              ${pipsHtml}
            </div>
            ${equippedGun.notes ? `<p class="p5-weapon-notes">${escapeHtml(equippedGun.notes)}</p>` : ''}
          </div>

          <div class="p5-gun-burst-panel">
            ${bullets <= 0 ? `
              <div class="p5-empty-mag-alert">
                <strong>MAGAZINE KOSONG (0/${maxBullets})!</strong>
                <span>Klik <em>RESET ENCOUNTER</em> di bawah saat masuk pertempuran berikutnya untuk reload penuh.</span>
              </div>
            ` : `
              <div class="p5-burst-label">JUMLAH PELURU DITEMBAKKAN SEKALIGUS:</div>
              <div class="p5-burst-stepper">
                <button type="button" class="p5-vadj-btn" id="p5ShotMinusBtn" ${shots <= 1 ? 'disabled' : ''}>−</button>
                <span class="p5-burst-count-num" id="p5ShotCountDisplay">${shots}</span>
                <button type="button" class="p5-vadj-btn" id="p5ShotPlusBtn" ${shots >= bullets ? 'disabled' : ''}>+</button>
              </div>
              <div class="p5-burst-presets">
                <button type="button" class="p5-filter-pill ${shots === 1 ? 'active' : ''}" data-shot-preset="1">1 SHOT</button>
                ${bullets >= 2 ? `<button type="button" class="p5-filter-pill ${shots === 2 ? 'active' : ''}" data-shot-preset="2">2 SHOTS</button>` : ''}
                ${bullets >= 3 ? `<button type="button" class="p5-filter-pill ${shots === 3 ? 'active' : ''}" data-shot-preset="3">3 SHOTS</button>` : ''}
                ${bullets >= 4 && halfMag !== 2 && halfMag !== 3 ? `<button type="button" class="p5-filter-pill ${shots === halfMag ? 'active' : ''}" data-shot-preset="${halfMag}">HALF (${halfMag})</button>` : ''}
                <button type="button" class="p5-filter-pill p5-preset-empty-mag ${shots === bullets ? 'active' : ''}" data-shot-preset="${bullets}">
                  HABISKAN (${bullets})
                </button>
              </div>
              <div class="p5-burst-preview">
                BURST DAMAGE: <strong>${burstDice}${burstDmgMod ? ' ' + formatMod(burstDmgMod) : ''}</strong> (Sisa peluru: ${bullets - shots}/${maxBullets})
              </div>
              <button type="button" class="p5-aoa-trigger-btn" id="p5ExecuteGunFireBtn" style="width:100%;font-size:1.2rem;padding:0.65rem 1.2rem;">
                TEMBAK ${shots} PELURU (${burstDice})
              </button>
            `}
          </div>
        </div>

        ${isArmoryOpen ? renderWeaponArmoryPanel(pData, 'gun') : ''}
      </div>
    `;
  }

  // --- E. GUARD STANCE BANNER ---
  if (selectedBattleCommand === 'guard') {
    return `
      <div class="p5-skills-drawer p5-guard-banner" id="p5GuardBanner">
        <div class="p5-guard-banner-content">
          <div>
            <div class="p5-drawer-title" style="color:var(--p5-cyan);">GUARD STANCE AKTIF // PERTAHANAN PENUH</div>
            <p class="p5-weapon-notes" style="margin:0.35rem 0 0 0;">
              <strong>+2 Physical AC</strong>, mengurangi damage masuk sebesar separuh (Resistensi sementara), dan <strong>kebal Knockdown / One More</strong> akibat Weakness sampai awal giliran berikutnya. Memilih aksi lain otomatis melepas Guard.
            </p>
          </div>
          <button type="button" class="p5-encounter-btn" id="p5CancelGuardBtn">
            LEPAS GUARD
          </button>
        </div>
      </div>
    `;
  }

  return '';
}

function renderWeaponArmoryPanel(pData: CharacterPersona, kind: PersonaWeaponKind): string {
  const ownedOfKind = (pData.weapons || []).filter((w) => w.kind === kind);
  const equippedId = kind === 'melee' ? pData.equippedMeleeId : pData.equippedGunId;
  const catalogList = kind === 'melee' ? PERSONA_MELEE_CATALOG : PERSONA_GUN_CATALOG;
  const ownedIds = new Set(ownedOfKind.map((w) => w.id));
  const kindLabel = kind === 'melee' ? 'SWORD / MELEE' : 'GUN / FIREARM';

  return `
    <div class="p5-subpanel-box" id="p5WeaponArmoryPanel" data-armory-kind="${kind}">
      <div class="p5-armory-tabs">
        <button type="button" class="p5-filter-pill ${armorySubTab === 'owned' ? 'active' : ''}" data-armory-tab="owned">
          KOLEKSI ${kindLabel} (${ownedOfKind.length})
        </button>
        <button type="button" class="p5-filter-pill ${armorySubTab === 'catalog' ? 'active' : ''}" data-armory-tab="catalog">
          KATALOG RESMI PERSONA 5
        </button>
        <button type="button" class="p5-filter-pill ${armorySubTab === 'custom' ? 'active' : ''}" data-armory-tab="custom">
          + BUAT SENJATA CUSTOM
        </button>
      </div>

      ${armorySubTab === 'owned' ? `
        <div class="p5-catalog-grid">
          ${ownedOfKind.map((w) => {
            const isEquipped = w.id === equippedId;
            return `
              <div class="p5-catalog-card ${isEquipped ? 'is-equipped' : ''}">
                <div class="p5-catalog-card-top">
                  <strong class="p5-catalog-name">${escapeHtml(w.name)}</strong>
                  <span class="p5-cat-tag" style="border-color:${isEquipped ? 'var(--p5-yellow)' : '#666'};color:${isEquipped ? 'var(--p5-yellow)' : '#ccc'};">
                    ${isEquipped ? 'EQUIPPED' : escapeHtml(w.origin || 'OWNED')}
                  </span>
                </div>
                <div class="p5-weapon-mini-stats">
                  Hit ${formatMod(w.toHitBonus)} • Dmg ${escapeHtml(w.damageDice)}${w.damageBonus ? formatMod(w.damageBonus) : ''}${w.kind === 'gun' ? ` • Mag ${w.maxBullets || 8}` : ''}
                </div>
                ${w.notes ? `<p class="p5-catalog-desc">${escapeHtml(w.notes)}</p>` : ''}
                <div class="p5-catalog-actions">
                  ${isEquipped
                    ? `<span style="font-size:0.75rem;color:var(--p5-yellow);font-weight:700;">SEDANG DIPAKAI</span>`
                    : `<button type="button" class="p5-cast-btn" data-equip-weapon="${escapeHtml(w.id)}" data-equip-kind="${kind}">EQUIP</button>`
                  }
                  ${ownedOfKind.length > 1 && !isEquipped
                    ? `<button type="button" class="p5-photo-btn p5-photo-btn-ghost" data-delete-weapon="${escapeHtml(w.id)}" style="padding:2px 8px;font-size:0.75rem;">HAPUS</button>`
                    : ''
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      ${armorySubTab === 'catalog' ? `
        <div class="p5-catalog-grid">
          ${catalogList.map((w) => {
            const alreadyOwned = ownedIds.has(w.id);
            return `
              <div class="p5-catalog-card">
                <div class="p5-catalog-card-top">
                  <strong class="p5-catalog-name">${escapeHtml(w.name)}</strong>
                  <span class="p5-cat-tag" style="border-color:var(--p5-red);color:#ff8a93;">${escapeHtml(w.origin || 'P5R')}</span>
                </div>
                <div class="p5-weapon-mini-stats">
                  Hit ${formatMod(w.toHitBonus)} • Dmg ${escapeHtml(w.damageDice)}${w.damageBonus ? formatMod(w.damageBonus) : ''}${w.kind === 'gun' ? ` • Mag ${w.maxBullets || 8}` : ''}${w.critRange === 19 ? ' • Crit 19–20' : ''}
                </div>
                ${w.notes ? `<p class="p5-catalog-desc">${escapeHtml(w.notes)}</p>` : ''}
                <div class="p5-catalog-actions">
                  ${alreadyOwned
                    ? `<button type="button" class="p5-cast-btn" data-equip-weapon="${w.id}" data-equip-kind="${kind}">EQUIP</button>`
                    : `<button type="button" class="p5-cast-btn" data-add-catalog-weapon="${w.id}" data-equip-kind="${kind}">+ TAMBAH &amp; EQUIP</button>`
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      ${armorySubTab === 'custom' ? `
        <div class="p5-custom-builder-box">
          <div class="p5-subpanel-subtitle">RANCANG ${kindLabel} CUSTOM</div>
          <div class="p5-custom-form-grid">
            <label class="p5-mini-field">
              <span>Nama Senjata</span>
              <input type="text" id="p5CustomWepName" class="p5-form-input" placeholder="${kind === 'melee' ? 'Contoh: Crimson Katana' : 'Contoh: Silver Desert Eagle'}" maxlength="40" />
            </label>
            <label class="p5-mini-field">
              <span>Bonus To-Hit</span>
              <input type="number" id="p5CustomWepHit" class="p5-form-input" value="1" min="-5" max="15" />
            </label>
            <label class="p5-mini-field">
              <span>Dadu Damage</span>
              <input type="text" id="p5CustomWepDice" class="p5-form-input" value="${kind === 'melee' ? '1d8' : '1d6'}" placeholder="1d8 / 2d6" />
            </label>
            <label class="p5-mini-field">
              <span>Bonus Damage Flat</span>
              <input type="number" id="p5CustomWepDmgBonus" class="p5-form-input" value="0" min="-5" max="20" />
            </label>
            ${kind === 'gun' ? `
              <label class="p5-mini-field">
                <span>Kapasitas Magazin</span>
                <input type="number" id="p5CustomWepMag" class="p5-form-input" value="8" min="1" max="30" />
              </label>
            ` : `
              <label class="p5-mini-field">
                <span>Crit Range</span>
                <select id="p5CustomWepCrit" class="p5-form-input">
                  <option value="20">Normal (Nat 20)</option>
                  <option value="19">High Crit (19–20)</option>
                </select>
              </label>
            `}
          </div>
          <div style="display:flex;gap:0.6rem;margin-top:0.65rem;flex-wrap:wrap;">
            <input type="text" id="p5CustomWepNotes" class="p5-form-input" style="flex:1;min-width:200px;" placeholder="Catatan / efek khusus senjata (opsional)..." />
            <button type="button" class="p5-aoa-trigger-btn" id="p5SaveCustomWeaponBtn" data-custom-kind="${kind}" style="font-size:1rem;padding:0.5rem 1.2rem;">
              BUAT &amp; EQUIP SENJATA
            </button>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function attachPersonaBattleDeckEvents(container: HTMLElement, char: Character): void {
  const rerenderDeck = () => {
    container.innerHTML = renderPersonaBattleDeck(char);
    attachPersonaBattleDeckEvents(container, char);
  };

  // If not awakened, attach wizard launcher with Awakening Fire transition
  const awakenPromptBtn = document.getElementById('p5DeckAwakenPromptBtn');
  if (awakenPromptBtn) {
    awakenPromptBtn.addEventListener('click', () => {
      personaTransitionOverlay.play('awakening', () => {
        personaWizardModal.open(char, (newPersona) => {
          char.persona = newPersona;
          rerenderDeck();
        });
      });
    });
    return;
  }

  if (!char.persona) return;
  const pData = char.persona;
  ensurePersonaLoadout(pData);

  if (unbindDeckAudioBadge) unbindDeckAudioBadge();
  unbindDeckAudioBadge = bindPersonaAudioBadge('p5DeckAudioBadge');

  const level = Math.max(1, Math.min(6, char.level || 1));
  const pb = getProficiencyBonus(level);
  const stats = calculatePersonaStats(char, pData.arcanaId, pData.worldChosenStat);
  const maxHp = toBattleMaxHp(char.vitals?.physicalHpMax || 10);
  const maxSp = toBattleMaxSp(char.vitals?.composureMax || 10);

  /** Helper: persist persona + synced sheet vitals (floor ÷ 10) asynchronously with instant optimistic UI */
  const persistPersonaAndVitals = (syncVitals: boolean = true) => {
    if (syncVitals) {
      syncPersonaToSheetVitals(char, pData.currentHp, pData.currentSp);
    }
    const payload: Partial<Character> = syncVitals
      ? { persona: JSON.parse(JSON.stringify(pData)), vitals: char.vitals ? { ...char.vitals } : undefined }
      : { persona: JSON.parse(JSON.stringify(pData)) };

    void characterStore
      .runOptimisticUpdate(
        (draft) => {
          draft.persona = JSON.parse(JSON.stringify(pData));
          if (syncVitals && char.vitals) {
            draft.vitals = { ...char.vitals };
          }
        },
        async () => {
          return await updateCharacterDirect(char.id, payload);
        }
      )
      .catch((err: any) => {
        console.warn('Gagal menyinkronkan Persona ke cloud:', err);
      });
  };

  // --------------------------------------------------------------------------
  // 1. PERSONA IMAGE UPLOAD / REPLACE / REMOVE (NEVER TOUCHES HUMAN AVATAR)
  // --------------------------------------------------------------------------
  const photoBox = document.getElementById('p5PersonaPhotoBox');
  const photoInput = document.getElementById('p5PersonaPhotoInput') as HTMLInputElement | null;
  const uploadBtn = document.getElementById('p5UploadPersonaPhotoBtn');
  const removePhotoBtn = document.getElementById('p5RemovePersonaPhotoBtn');
  const photoLoading = document.getElementById('p5PersonaImgLoading');

  const openPhotoPicker = () => photoInput?.click();
  photoBox?.addEventListener('click', openPhotoPicker);
  photoBox?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPhotoPicker();
    }
  });
  uploadBtn?.addEventListener('click', openPhotoPicker);

  photoInput?.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    if (photoLoading) photoLoading.style.display = 'flex';
    try {
      const publicUrl = await uploadPersonaImage(file, char.id);
      pData.personaImagePath = publicUrl;
      await persistPersonaAndVitals(false);
      showToast(`Foto Persona ${pData.personaName} berhasil diunggah!`, 'success');
      rerenderDeck();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto Persona.', 'error');
      if (photoLoading) photoLoading.style.display = 'none';
    }
  });

  removePhotoBtn?.addEventListener('click', async () => {
    pData.personaImagePath = '';
    await persistPersonaAndVitals(false);
    showToast('Foto Persona dihapus.', 'info');
    rerenderDeck();
  });

  // --------------------------------------------------------------------------
  // 2. CUSTOM HP / SP ADJUSTER (SYNCED TO NORMAL SHEET VIA FLOOR ÷ 10)
  // --------------------------------------------------------------------------
  const applyVitalDelta = async (type: 'hp' | 'sp', delta: number, setFull: boolean = false) => {
    if (type === 'hp') {
      const prev = pData.currentHp ?? maxHp;
      pData.currentHp = setFull ? maxHp : Math.max(0, Math.min(maxHp, prev + delta));
      await persistPersonaAndVitals(true);
      const sheetHp = fromBattleHp(pData.currentHp);
      showToast(
        setFull
          ? `HP Persona pulih penuh: ${pData.currentHp}/${maxHp} (Sheet: ${sheetHp})`
          : `HP Persona ${delta >= 0 ? `+${delta}` : delta} → ${pData.currentHp}/${maxHp} (Sheet Normal: ${sheetHp})`,
        delta >= 0 || setFull ? 'success' : 'warning'
      );
    } else {
      const prev = pData.currentSp ?? maxSp;
      pData.currentSp = setFull ? maxSp : Math.max(0, Math.min(maxSp, prev + delta));
      await persistPersonaAndVitals(true);
      const sheetComp = fromBattleSp(pData.currentSp);
      showToast(
        setFull
          ? `SP Persona pulih penuh: ${pData.currentSp}/${maxSp} (Composure: ${sheetComp})`
          : `SP Persona ${delta >= 0 ? `+${delta}` : delta} → ${pData.currentSp}/${maxSp} (Composure Normal: ${sheetComp})`,
        delta >= 0 || setFull ? 'success' : 'info'
      );
    }
    rerenderDeck();
  };

  document.getElementById('p5HpMinusBtn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt((document.getElementById('p5HpAdjustInput') as HTMLInputElement)?.value || '10', 10) || 10);
    void applyVitalDelta('hp', -val);
  });
  document.getElementById('p5HpPlusBtn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt((document.getElementById('p5HpAdjustInput') as HTMLInputElement)?.value || '10', 10) || 10);
    void applyVitalDelta('hp', val);
  });
  document.getElementById('p5HpFullBtn')?.addEventListener('click', () => {
    void applyVitalDelta('hp', 0, true);
  });

  document.getElementById('p5SpMinusBtn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt((document.getElementById('p5SpAdjustInput') as HTMLInputElement)?.value || '10', 10) || 10);
    void applyVitalDelta('sp', -val);
  });
  document.getElementById('p5SpPlusBtn')?.addEventListener('click', () => {
    const val = Math.max(1, parseInt((document.getElementById('p5SpAdjustInput') as HTMLInputElement)?.value || '10', 10) || 10);
    void applyVitalDelta('sp', val);
  });
  document.getElementById('p5SpFullBtn')?.addEventListener('click', () => {
    void applyVitalDelta('sp', 0, true);
  });

  // Dismiss Active Effect Pills
  container.querySelectorAll('.p5-effect-dismiss').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.effectId;
      pData.activeEffects = (pData.activeEffects || []).filter((ef) => ef.id !== id);
      await persistPersonaAndVitals(false);
      rerenderDeck();
    });
  });

  // --------------------------------------------------------------------------
  // 3. RADIAL COMMAND BUTTONS — STRICT 1-ACTIVE MUTUAL EXCLUSION
  // --------------------------------------------------------------------------
  container.querySelectorAll('.p5-cmd-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const cmd = target.dataset.cmd as BattleCommand | undefined;
      if (!cmd) return;

      const prevCmd = selectedBattleCommand;
      if (prevCmd === cmd) {
        selectedBattleCommand = null;
        if (cmd === 'guard') showToast('Guard stance dinonaktifkan.', 'info');
      } else {
        selectedBattleCommand = cmd;
        isArmoryOpen = false;
        isItemCatalogOpen = false;
        if (prevCmd === 'guard') {
          const cmdName = cmd === 'attack' ? 'SWORD' : cmd.toUpperCase();
          showToast(`Guard stance dilepas — beralih ke ${cmdName}.`, 'info');
        } else if (cmd === 'guard') {
          showToast('Memasang Guard Stance (+2 AC & resistensi damage).', 'info');
        }
      }
      rerenderDeck();
    });
  });

  document.getElementById('p5CancelGuardBtn')?.addEventListener('click', () => {
    selectedBattleCommand = null;
    showToast('Guard stance dinonaktifkan.', 'info');
    rerenderDeck();
  });

  // --------------------------------------------------------------------------
  // 4. SPELL CASTING (FOCUSED ACTION ROLLER + SYNCED SP DEDUCTION)
  // --------------------------------------------------------------------------
  container.querySelectorAll('.p5-cast-spell-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const spellId = (e.currentTarget as HTMLElement).dataset.spellId;
      if (!spellId) return;
      const spell = SPELL_BY_ID.get(spellId);
      if (!spell) return;

      const isFree = spell.tier === 0 && !turnUsedFreeSpell;
      const cost = isFree ? 0 : spell.spCost;

      if ((pData.currentSp || 0) < cost) {
        showToast('SP tidak mencukupi untuk menggunakan spell ini!', 'warning');
        return;
      }

      pData.currentSp = Math.max(0, (pData.currentSp || 0) - cost);
      if (spell.tier === 0 && !turnUsedFreeSpell) {
        turnUsedFreeSpell = true;
      }

      await persistPersonaAndVitals(true);

      const isPhys = spell.element === 'physical' || spell.element === 'gun';
      const mod = isPhys ? stats.str.mod : stats.mag.mod;
      const damageSpec = resolveSpellDamageSpec(spell, stats);

      const steps: Array<{
        id: 'to_hit' | 'damage' | 'heal' | 'check';
        label: string;
        dice: string;
        mod: number;
        subtitle?: string;
      }> = [];

      if (spell.category === 'attack') {
        steps.push({
          id: 'to_hit',
          label: 'To Hit',
          dice: '1d20',
          mod: mod + pb,
          subtitle: `${spell.element.toUpperCase()} Spell Attack • DC ${calculateSpellDC(pb, mod)}`,
        });
      }

      if (damageSpec) {
        steps.push({
          id: damageSpec.isHeal ? 'heal' : 'damage',
          label: damageSpec.isHeal ? 'Pulihkan HP' : 'Damage',
          dice: damageSpec.dice,
          mod: damageSpec.mod,
          subtitle: `${spell.element.toUpperCase()} • ${spell.damageFormula}`,
        });
      }

      if (steps.length === 0) {
        steps.push({
          id: 'check',
          label: 'Spell Check',
          dice: '1d20',
          mod: mod + pb,
          subtitle: spell.effect,
        });
      }

      diceRollerModal.showAction({
        title: `PERSONA SPELL: ${spell.name.toUpperCase()}`,
        subtitle: `${cost === 0 ? 'FREE (1st Tier 0)' : `${cost} SP terpotong`} • ${spell.range || 'Persona Skill'}`,
        theme: 'persona',
        steps,
      });

      showToast(`Menggunakan ${spell.name} (${cost} SP terpotong • Sisa ${pData.currentSp} SP)`, 'success');
      rerenderDeck();
    });
  });

  // --------------------------------------------------------------------------
  // 5. PERSONA INVENTORY BAG + CATALOG + AUTO-CONSUME & AUTO-EFFECT
  // --------------------------------------------------------------------------
  document.getElementById('p5ToggleItemCatalogBtn')?.addEventListener('click', () => {
    isItemCatalogOpen = !isItemCatalogOpen;
    rerenderDeck();
  });

  container.querySelectorAll('[data-bag-cat]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      activeItemCategoryFilter = ((e.currentTarget as HTMLElement).dataset.bagCat || 'all') as PersonaItemCategory | 'all';
      rerenderDeck();
    });
  });

  container.querySelectorAll('[data-catalog-cat]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      itemCatalogCategory = ((e.currentTarget as HTMLElement).dataset.catalogCat || 'all') as PersonaItemCategory | 'all';
      rerenderDeck();
    });
  });

  const addItemToBag = async (itemId: string, qty: number, customDef?: PersonaItemDef) => {
    const items = pData.items || [];
    const existing = items.find((i) => i.itemId === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push(customDef ? { itemId, qty, customItem: customDef } : { itemId, qty });
    }
    pData.items = items;
    await persistPersonaAndVitals(false);
    const resolved = customDef || resolvePersonaItem({ itemId, qty });
    showToast(`+${qty} ${resolved?.name || 'Item'} ditambahkan ke Persona Item Bag.`, 'success');
    rerenderDeck();
  };

  container.querySelectorAll('[data-add-item-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      const itemId = el.dataset.addItemId!;
      const qty = Number(el.dataset.addQty) || 1;
      void addItemToBag(itemId, qty);
    });
  });

  container.querySelectorAll('[data-inc-item]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const itemId = (e.currentTarget as HTMLElement).dataset.incItem!;
      void addItemToBag(itemId, 1);
    });
  });

  document.getElementById('p5CreateCustomItemBtn')?.addEventListener('click', () => {
    const name = (document.getElementById('p5CustomItemName') as HTMLInputElement)?.value.trim();
    const cat = ((document.getElementById('p5CustomItemCat') as HTMLSelectElement)?.value || 'heal_hp') as PersonaItemCategory;
    const rawVal = (document.getElementById('p5CustomItemValue') as HTMLInputElement)?.value.trim();
    const qty = Math.max(1, parseInt((document.getElementById('p5CustomItemQty') as HTMLInputElement)?.value || '1', 10) || 1);
    const desc = (document.getElementById('p5CustomItemDesc') as HTMLInputElement)?.value.trim();

    if (!name) {
      showToast('Isi nama item custom terlebih dahulu.', 'warning');
      return;
    }

    const numVal = parseInt(rawVal, 10);
    const customDef: PersonaItemDef = {
      id: `p5_custom_item_${Date.now()}`,
      name,
      category: cat,
      description: desc || `Item custom kategori ${getCategoryBadgeLabel(cat)}.`,
      isCustom: true,
    };

    if (cat === 'heal_hp') {
      customDef.hpRestore = !Number.isNaN(numVal) && numVal > 0 ? numVal : 30;
    } else if (cat === 'heal_sp') {
      customDef.spRestore = !Number.isNaN(numVal) && numVal > 0 ? numVal : 20;
    } else if (cat === 'heal_both') {
      const amt = !Number.isNaN(numVal) && numVal > 0 ? numVal : 30;
      customDef.hpRestore = amt;
      customDef.spRestore = amt;
    } else if (cat === 'damage') {
      customDef.damageDice = rawVal && /\d*d\d+/i.test(rawVal) ? rawVal : '2d6';
      customDef.damageMod = 0;
      customDef.damageElement = 'almighty';
    } else {
      customDef.effectLabel = rawVal || `${name.toUpperCase()} ACTIVE`;
    }

    void addItemToBag(customDef.id, qty, customDef);
  });

  // USE ITEM — Auto-Consume (qty - 1) & Auto-Execute Effect!
  container.querySelectorAll('.p5-use-item-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const itemId = (e.currentTarget as HTMLElement).dataset.useItem;
      if (!itemId) return;

      const entries = pData.items || [];
      const idx = entries.findIndex((entry) => entry.itemId === itemId);
      if (idx < 0) return;

      const entry = entries[idx];
      const def = resolvePersonaItem(entry);
      if (!def) return;

      // Consume 1 unit (remove when depleted)
      entry.qty -= 1;
      const remaining = Math.max(0, entry.qty);
      if (remaining <= 0) {
        entries.splice(idx, 1);
      }
      pData.items = entries;

      // Apply automatic item effects
      let didModifyVitals = false;
      const feedbackParts: string[] = [];

      if (def.hpRestore || def.hpRestorePercent) {
        const gain = def.hpRestorePercent
          ? Math.round(maxHp * def.hpRestorePercent)
          : (def.hpRestore || 0);
        const before = pData.currentHp ?? maxHp;
        pData.currentHp = Math.min(maxHp, before + gain);
        didModifyVitals = true;
        feedbackParts.push(`+${pData.currentHp - before} HP (${pData.currentHp}/${maxHp})`);
      }

      if (def.spRestore || def.spRestorePercent) {
        const gain = def.spRestorePercent
          ? Math.round(maxSp * def.spRestorePercent)
          : (def.spRestore || 0);
        const before = pData.currentSp ?? maxSp;
        pData.currentSp = Math.min(maxSp, before + gain);
        didModifyVitals = true;
        feedbackParts.push(`+${pData.currentSp - before} SP (${pData.currentSp}/${maxSp})`);
      }

      if (def.category === 'buff' || def.category === 'debuff') {
        const effects = pData.activeEffects || [];
        effects.push({
          id: `ef_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: def.effectLabel || def.name.toUpperCase(),
          type: def.category === 'buff' ? (def.name.includes('Ointment') ? 'shield' : 'buff') : 'debuff',
          turnsRemaining: def.durationTurns,
        });
        pData.activeEffects = effects;
        feedbackParts.push(def.effectLabel || 'Efek aktif');
      }

      if (def.category === 'cure') {
        feedbackParts.push(def.effectLabel || 'Status negatif disembuhkan');
      }

      await persistPersonaAndVitals(didModifyVitals);

      if (def.category === 'damage' && def.damageDice) {
        diceRollerModal.showAction({
          title: `ITEM ATTACK: ${def.name.toUpperCase()}`,
          subtitle: `${(def.damageElement || 'almighty').toUpperCase()} Item • Sisa stok: ×${remaining}`,
          theme: 'persona',
          steps: [
            {
              id: 'damage',
              label: `${(def.damageElement || 'Item').toUpperCase()} Damage`,
              dice: def.damageDice,
              mod: def.damageMod || 0,
              subtitle: def.description,
            },
          ],
        });
        showToast(`Menggunakan ${def.name} (Sisa ×${remaining})!`, 'info');
      } else {
        showToast(
          `Memakai ${def.name}: ${feedbackParts.join(' & ')} (Sisa ×${remaining})`,
          'success'
        );
      }

      rerenderDeck();
    });
  });

  // --------------------------------------------------------------------------
  // 6. SWORD ATTACK & GUN MULTI-BULLET BURST FIRE + ARMORY
  // --------------------------------------------------------------------------
  document.getElementById('p5ExecuteSwordAttackBtn')?.addEventListener('click', () => {
    const wep = getEquippedWeapon(pData, 'melee');
    const toHitMod = calculateAttackBonus(stats.str.mod, pb) + wep.toHitBonus;
    const dmgMod = stats.str.mod + wep.damageBonus;

    diceRollerModal.showAction({
      title: `SWORD: ${wep.name.toUpperCase()}`,
      subtitle: wep.notes || `Melee Physical Attack • Crit ${wep.critRange === 19 ? '19–20' : '20'}`,
      theme: 'persona',
      steps: [
        {
          id: 'to_hit',
          label: 'To Hit',
          dice: '1d20',
          mod: toHitMod,
          critRange: wep.critRange || 20,
          subtitle: `STR (${formatMod(stats.str.mod)}) + PB (+${pb}) + Weapon (${formatMod(wep.toHitBonus)})`,
        },
        {
          id: 'damage',
          label: 'Sword Damage',
          dice: wep.damageDice,
          mod: dmgMod,
          subtitle: `Physical Melee • ${wep.damageDice}${dmgMod ? ' ' + formatMod(dmgMod) : ''}`,
        },
      ],
    });
  });

  // Gun Multi-Bullet Controls
  const equippedGun = getEquippedWeapon(pData, 'gun');
  const maxBullets = equippedGun.maxBullets || pData.maxGunBullets || DEFAULT_MAX_BULLETS;
  const currentBullets = Math.max(0, Math.min(maxBullets, pData.gunBullets !== undefined ? pData.gunBullets : maxBullets));

  document.getElementById('p5ShotMinusBtn')?.addEventListener('click', () => {
    selectedGunShotCount = Math.max(1, selectedGunShotCount - 1);
    rerenderDeck();
  });
  document.getElementById('p5ShotPlusBtn')?.addEventListener('click', () => {
    selectedGunShotCount = Math.min(Math.max(1, currentBullets), selectedGunShotCount + 1);
    rerenderDeck();
  });
  container.querySelectorAll('[data-shot-preset]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const preset = Number((e.currentTarget as HTMLElement).dataset.shotPreset) || 1;
      selectedGunShotCount = Math.max(1, Math.min(Math.max(1, currentBullets), preset));
      rerenderDeck();
    });
  });

  document.getElementById('p5ExecuteGunFireBtn')?.addEventListener('click', async () => {
    if (currentBullets <= 0) {
      showToast('Magazine kosong! Reset encounter untuk reload.', 'warning');
      return;
    }

    const shotsFired = Math.max(1, Math.min(currentBullets, selectedGunShotCount));
    pData.gunBullets = Math.max(0, currentBullets - shotsFired);
    pData.maxGunBullets = maxBullets;

    await persistPersonaAndVitals(false);

    const toHitMod = calculateAttackBonus(stats.str.mod, pb) + equippedGun.toHitBonus;
    const burstDice = scaleDiceExpression(equippedGun.damageDice, shotsFired);
    const burstDmgMod = stats.str.mod + equippedGun.damageBonus * shotsFired;

    diceRollerModal.showAction({
      title: `GUN: ${equippedGun.name.toUpperCase()} (${shotsFired} ${shotsFired > 1 ? 'ROUNDS' : 'ROUND'})`,
      subtitle: `Amunisi tersisa: ${pData.gunBullets}/${maxBullets}`,
      theme: 'persona',
      steps: [
        {
          id: 'to_hit',
          label: 'To Hit',
          dice: '1d20',
          mod: toHitMod,
          critRange: equippedGun.critRange || 20,
          subtitle: `STR (${formatMod(stats.str.mod)}) + PB (+${pb}) + Gun (${formatMod(equippedGun.toHitBonus)})`,
        },
        {
          id: 'damage',
          label: shotsFired > 1 ? `Burst Damage (${shotsFired}×)` : 'Gun Damage',
          dice: burstDice,
          mod: burstDmgMod,
          subtitle: `${shotsFired} peluru × ${equippedGun.damageDice}${equippedGun.damageBonus ? formatMod(equippedGun.damageBonus) : ''} + STR`,
        },
      ],
    });

    showToast(
      `Menembakkan ${shotsFired} peluru (${equippedGun.name})! Sisa amunisi: ${pData.gunBullets}/${maxBullets}`,
      pData.gunBullets === 0 ? 'warning' : 'info'
    );
    selectedGunShotCount = Math.max(1, Math.min(1, pData.gunBullets));
    rerenderDeck();
  });

  // Armory Controls (Sword & Gun)
  document.getElementById('p5ToggleArmoryBtn')?.addEventListener('click', () => {
    isArmoryOpen = !isArmoryOpen;
    armorySubTab = 'owned';
    rerenderDeck();
  });

  container.querySelectorAll('[data-armory-tab]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      armorySubTab = ((e.currentTarget as HTMLElement).dataset.armoryTab || 'owned') as 'owned' | 'catalog' | 'custom';
      rerenderDeck();
    });
  });

  const equipWeapon = async (weaponId: string, kind: PersonaWeaponKind) => {
    const wep = (pData.weapons || []).find((w) => w.id === weaponId && w.kind === kind);
    if (!wep) return;
    if (kind === 'melee') {
      pData.equippedMeleeId = wep.id;
    } else {
      pData.equippedGunId = wep.id;
      const newMax = wep.maxBullets || DEFAULT_MAX_BULLETS;
      pData.maxGunBullets = newMax;
      pData.gunBullets = newMax;
      selectedGunShotCount = 1;
    }
    await persistPersonaAndVitals(false);
    showToast(`Senjata aktif diganti ke ${wep.name}!`, 'success');
    rerenderDeck();
  };

  container.querySelectorAll('[data-equip-weapon]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const el = e.currentTarget as HTMLElement;
      void equipWeapon(el.dataset.equipWeapon!, el.dataset.equipKind as PersonaWeaponKind);
    });
  });

  container.querySelectorAll('[data-add-catalog-weapon]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const el = e.currentTarget as HTMLElement;
      const id = el.dataset.addCatalogWeapon!;
      const kind = el.dataset.equipKind as PersonaWeaponKind;
      const pool = kind === 'melee' ? PERSONA_MELEE_CATALOG : PERSONA_GUN_CATALOG;
      const found = pool.find((w) => w.id === id);
      if (!found) return;
      pData.weapons = [...(pData.weapons || []), { ...found }];
      armorySubTab = 'owned';
      await equipWeapon(found.id, kind);
    });
  });

  container.querySelectorAll('[data-delete-weapon]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.deleteWeapon!;
      pData.weapons = (pData.weapons || []).filter((w) => w.id !== id);
      await persistPersonaAndVitals(false);
      showToast('Senjata dihapus dari koleksi Armory.', 'info');
      rerenderDeck();
    });
  });

  document.getElementById('p5SaveCustomWeaponBtn')?.addEventListener('click', async (e) => {
    const kind = (e.currentTarget as HTMLElement).dataset.customKind as PersonaWeaponKind;
    const name = (document.getElementById('p5CustomWepName') as HTMLInputElement)?.value.trim();
    const toHitBonus = parseInt((document.getElementById('p5CustomWepHit') as HTMLInputElement)?.value || '0', 10) || 0;
    const rawDice = (document.getElementById('p5CustomWepDice') as HTMLInputElement)?.value.trim() || '1d6';
    const damageBonus = parseInt((document.getElementById('p5CustomWepDmgBonus') as HTMLInputElement)?.value || '0', 10) || 0;
    const notes = (document.getElementById('p5CustomWepNotes') as HTMLInputElement)?.value.trim();

    if (!name) {
      showToast('Nama senjata custom wajib diisi.', 'warning');
      return;
    }
    if (!/^\d*d\d+$/i.test(rawDice)) {
      showToast('Format dadu damage tidak valid (gunakan format seperti 1d8, 2d6, 1d10).', 'warning');
      return;
    }

    const customWep: PersonaWeaponDef = {
      id: `p5_custom_wep_${Date.now()}`,
      name,
      kind,
      origin: 'Custom',
      toHitBonus,
      damageDice: rawDice.toLowerCase(),
      damageBonus,
      notes,
      isCustom: true,
    };

    if (kind === 'gun') {
      const mag = Math.max(1, Math.min(30, parseInt((document.getElementById('p5CustomWepMag') as HTMLInputElement)?.value || '8', 10) || 8));
      customWep.maxBullets = mag;
    } else {
      const crit = parseInt((document.getElementById('p5CustomWepCrit') as HTMLSelectElement)?.value || '20', 10);
      customWep.critRange = crit === 19 ? 19 : 20;
    }

    pData.weapons = [...(pData.weapons || []), customWep];
    armorySubTab = 'owned';
    await equipWeapon(customWep.id, kind);
  });

  // --------------------------------------------------------------------------
  // 7. ENCOUNTER CONTROLS & ALL-OUT ATTACK
  // --------------------------------------------------------------------------
  document.getElementById('p5ResetEncounterBtn')?.addEventListener('click', async () => {
    const gun = getEquippedWeapon(pData, 'gun');
    const reloadMax = gun.maxBullets || DEFAULT_MAX_BULLETS;
    pData.maxGunBullets = reloadMax;
    pData.gunBullets = reloadMax;
    pData.activeEffects = [];
    turnUsedFreeSpell = false;
    selectedGunShotCount = 1;
    await persistPersonaAndVitals(false);
    showToast(`Encounter di-reset! Amunisi ${gun.name} terisi penuh (${reloadMax}/${reloadMax}).`, 'success');
    rerenderDeck();
  });

  document.getElementById('p5RestSpRecoverBtn')?.addEventListener('click', () => {
    turnUsedFreeSpell = false;
    showToast('Short Rest diambil: cast Tier 0 siap digunakan kembali tanpa potong SP!', 'info');
    rerenderDeck();
  });

  document.getElementById('p5TriggerAoaBtn')?.addEventListener('click', () => {
    allOutAttackModal.open(char);
  });
}

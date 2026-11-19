// ============================================================================
// PersonaBattleDeck — Persona 5 Royal Style Battle Deck Component
// ============================================================================

import {
  toBattleHp,
  toBattleMaxHp,
  toBattleSp,
  toBattleMaxSp,
  calculatePersonaStats,
  getComposureState,
  getAvailableSignatureSpells,
  getProficiencyBonus,
  calculateAttackBonus,
  calculateSpellDC,
  DEFAULT_MAX_BULLETS,
} from '../rules/personaRules';
import {
  MAJOR_ARCANA,
  ARCANA_BY_ID,
  SPELL_BY_ID,
  ELEMENT_METADATA,
} from '../data/personaData';
import { characterStore } from '../store/characterStore';
import { updateCharacterDirect } from '../api/characters';
import { diceRollerModal } from './DiceRollerModal';
import { personaWizardModal } from './PersonaWizardModal';
import { allOutAttackModal } from './AllOutAttackModal';
import { showToast } from './Toast';
import { renderPersonaAudioBadge, bindPersonaAudioBadge } from '../utils/personaAudio';
import type { Character } from '../types';
import type { ElementType, PersonaSpell, ArcanaInfo } from '../types/persona';

let selectedBattleCommand: string | null = 'persona';
let isGuardingActive = false;
let turnUsedFreeSpell = false;
let unbindDeckAudioBadge: (() => void) | null = null;

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
          🎭 BREAK THE MASK // AWAKEN PERSONA
        </button>
      </div>
    `;
  }

  const pData = char.persona;
  const arcana: ArcanaInfo = ARCANA_BY_ID.get(pData.arcanaId) || MAJOR_ARCANA[0];
  const level = Math.max(1, Math.min(6, char.level || 1));
  const pb = getProficiencyBonus(level);
  const stats = calculatePersonaStats(char, pData.arcanaId, pData.worldChosenStat);

  // Vitals calculation (×10)
  const maxHp = toBattleMaxHp(char.vitals?.physicalHpMax || 10);
  const currentHp = Math.min(maxHp, pData.currentHp !== undefined ? pData.currentHp : toBattleHp(char.vitals?.physicalHpCurrent || 10));
  const maxSp = toBattleMaxSp(char.vitals?.composureMax || 10);
  const currentSp = Math.min(maxSp, pData.currentSp !== undefined ? pData.currentSp : toBattleSp(char.vitals?.composureCurrent || 10));
  const hpPercent = Math.max(0, Math.min(100, Math.round((currentHp / maxHp) * 100)));
  const spPercent = Math.max(0, Math.min(100, Math.round((currentSp / maxSp) * 100)));

  const bullets = pData.gunBullets !== undefined ? pData.gunBullets : DEFAULT_MAX_BULLETS;
  const maxBullets = pData.maxGunBullets || DEFAULT_MAX_BULLETS;
  const composureState = getComposureState(currentSp, maxSp);

  // Unlocked Signature Spells + Equipped Spells
  const signatureIndices = getAvailableSignatureSpells(level);
  const activeSpellIds = new Set<string>();

  // Add unlocked signatures
  signatureIndices.forEach((idx) => {
    if (arcana.signatureSpells[idx]) {
      activeSpellIds.add(arcana.signatureSpells[idx]);
    }
  });

  // Add equipped choice spells
  (pData.equippedSpells || []).forEach((id) => activeSpellIds.add(id));

  const spellsToDisplay: PersonaSpell[] = [];
  activeSpellIds.forEach((id) => {
    const sp = SPELL_BY_ID.get(id);
    if (sp) spellsToDisplay.push(sp);
  });

  // Affinities computation
  const elements: ElementType[] = [
    'physical', 'gun', 'fire', 'ice', 'electric',
    'wind', 'psy', 'nuclear', 'bless', 'curse', 'almighty',
  ];

  return `
    <div class="persona-p5-scope" id="personaBattleDeckContainer">
      <!-- 1. DECK HEADER & VITALS (HP/SP × 10) -->
      <div class="p5-deck-header">
        <div class="p5-deck-title-area">
          <span class="p5-deck-badge">${arcana.roman} ${arcana.name.toUpperCase()}</span>
          <div>
            <div style="font-family:var(--p5-font-display);font-size:1.6rem;color:#fff;line-height:1;">
              ${char.name} // ${pData.personaName.toUpperCase()}
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
          <!-- HP Card -->
          <div class="p5-vital-card">
            <div class="p5-vital-label-row">
              <span class="p5-vital-name hp-label">HP</span>
              <span class="p5-vital-nums">${currentHp} / ${maxHp}</span>
            </div>
            <div class="p5-bar-track">
              <div class="p5-bar-fill-hp" style="width: ${hpPercent}%"></div>
            </div>
          </div>

          <!-- SP Card (Composure × 10) -->
          <div class="p5-vital-card">
            <div class="p5-vital-label-row">
              <span class="p5-vital-name sp-label">SP</span>
              <span class="p5-vital-nums">${currentSp} / ${maxSp}</span>
            </div>
            <div class="p5-bar-track">
              <div class="p5-bar-fill-sp" style="width: ${spPercent}%"></div>
            </div>
            <!-- Composure State Badge -->
            <div class="p5-state-indicator ${
              composureState === 'steady'
                ? 'p5-state-steady'
                : composureState === 'salting'
                ? 'p5-state-salting'
                : 'p5-state-meltdown'
            }">
              ${
                composureState === 'steady'
                  ? '⚡ STEADY (>50%)'
                  : composureState === 'salting'
                  ? '🔥 SALTING (SURGE READY)'
                  : '💀 MELTDOWN (LUMPUH)'
              }
            </div>
          </div>
        </div>
      </div>

      <!-- 2. PERSONA ID & STATS CENTER GRID -->
      <div class="p5-center-grid">
        <!-- Persona ID Card -->
        <div class="p5-persona-id-card">
          <div class="p5-persona-img-box">
            ${
              char.avatar_path
                ? `<img src="${char.avatar_path}" alt="${char.name}" />`
                : `<div style="font-family:var(--p5-font-display);font-size:3rem;color:#333;">PHANTOM</div>`
            }
          </div>
          <div class="p5-persona-arcana-ribbon">${arcana.name} [${arcana.nameJp}]</div>
          <div class="p5-persona-name-banner">${pData.personaName}</div>
          <div class="p5-persona-flavor">
            "${pData.personaVisual || arcana.theme}"
          </div>
        </div>

        <!-- Stats & Affinities Column -->
        <div>
          <!-- Stats Trio -->
          <div class="p5-stats-trio">
            <div class="p5-stat-card">
              <span class="p5-stat-title">STR (PHY)</span>
              <span class="p5-stat-value">${stats.str.score}</span>
              <span class="p5-stat-mod">MOD: ${stats.str.mod >= 0 ? '+' : ''}${stats.str.mod} // ATK: +${calculateAttackBonus(stats.str.mod, pb)}</span>
            </div>
            <div class="p5-stat-card">
              <span class="p5-stat-title">MAG (${arcana.primaryStat.slice(0,3).toUpperCase()})</span>
              <span class="p5-stat-value">${stats.mag.score}</span>
              <span class="p5-stat-mod">MOD: ${stats.mag.mod >= 0 ? '+' : ''}${stats.mag.mod} // DC: ${calculateSpellDC(pb, stats.mag.mod)}</span>
            </div>
            <div class="p5-stat-card">
              <span class="p5-stat-title">END (MIND)</span>
              <span class="p5-stat-value">${stats.end.score}</span>
              <span class="p5-stat-mod">MOD: ${stats.end.mod >= 0 ? '+' : ''}${stats.end.mod} // DAMPENER</span>
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

                // Check affinity progression
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

      <!-- 3. P5R AUTHENTIC RADIAL WEDGE COMMAND MENU -->
      <div class="p5-battle-section">
        <div class="p5-section-title">COMMAND MENU // PILIH AKSI BERTARUNG</div>

        <div class="p5-radial-command-stage" role="group" aria-label="Persona Battle Command Menu">
          <!-- Left Wing: GUN -->
          <div class="p5-radial-wing p5-radial-wing-left">
            <div class="p5-wedge-slot p5-slot-gun">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-gun ${selectedBattleCommand === 'gun' ? 'selected' : ''}" data-cmd="gun" aria-label="Gun Attack">
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
            <!-- Top-Right: PERSONA (△ Cyan) -->
            <div class="p5-wedge-slot p5-slot-persona">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-persona ${selectedBattleCommand === 'persona' ? 'selected' : ''}" data-cmd="persona" aria-label="Persona Skills">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-triangle" aria-hidden="true">△</span>
                  <span class="p5-wedge-label">PERSO<span class="p5-invert-letter">N</span>A</span>
                </span>
              </button>
            </div>

            <!-- Mid-Upper: ITEM (□ Pink) -->
            <div class="p5-wedge-slot p5-slot-item">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-item ${selectedBattleCommand === 'item' ? 'selected' : ''}" data-cmd="item" aria-label="Battle Items">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-square" aria-hidden="true">□</span>
                  <span class="p5-wedge-label">I<span class="p5-invert-letter">T</span>EM</span>
                </span>
              </button>
            </div>

            <!-- Mid-Lower Staggered Right: SWORD (○ Red) -->
            <div class="p5-wedge-slot p5-slot-sword">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-sword ${selectedBattleCommand === 'attack' ? 'selected' : ''}" data-cmd="attack" aria-label="Sword Melee Attack">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-circle" aria-hidden="true">○</span>
                  <span class="p5-wedge-label">SW<span class="p5-invert-letter">O</span>RD</span>
                </span>
              </button>
            </div>

            <!-- Bottom-Right: GUARD (✕ Blue) -->
            <div class="p5-wedge-slot p5-slot-guard">
              <button type="button" class="p5-cmd-btn p5-wedge-btn p5-wedge-btn-guard ${isGuardingActive ? 'selected' : ''}" data-cmd="guard" aria-label="Guard Stance">
                <span class="p5-wedge-shard" aria-hidden="true"></span>
                <span class="p5-wedge-body">
                  <span class="p5-wedge-symbol p5-sym-cross" aria-hidden="true">✕</span>
                  <span class="p5-wedge-label">${isGuardingActive ? 'G<span class="p5-invert-letter">U</span>ARDING' : 'G<span class="p5-invert-letter">U</span>ARD'}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. EXPANDABLE SKILL DRAWER (ACTIVE WHEN PERSONA COMMAND SELECTED) -->
        <div class="p5-skills-drawer" id="p5SkillsDrawer" style="${selectedBattleCommand === 'persona' ? 'display:block;' : 'display:none;'}">
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
                      <span>${sp.name}</span>
                    </span>
                    <span class="p5-sp-cost-chip ${isFree ? 'cost-free' : ''}">
                      ${isFree ? 'FREE (1st)' : `${sp.spCost} SP`}
                    </span>
                  </div>
                  <div class="p5-skill-desc">${sp.effect}</div>
                  <div class="p5-skill-action-row">
                    <span>${sp.actionType.toUpperCase().replace('_', ' ')} // ${sp.range || 'Ranged'}</span>
                    <button type="button" class="p5-cast-btn p5-cast-spell-btn" data-spell-id="${sp.id}" ${canCast ? '' : 'disabled style="opacity:0.4;cursor:not-allowed;"'}>
                      CAST ➔
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 5. ENCOUNTER CONTROL BAR -->
        <div class="p5-encounter-bar">
          <div class="p5-encounter-btn-group">
            <button type="button" class="p5-encounter-btn" id="p5ResetEncounterBtn">
              🔄 RESET ENCOUNTER (RELOAD AMMO)
            </button>
            <button type="button" class="p5-encounter-btn" id="p5RestSpRecoverBtn">
              💤 SHORT REST (RECOVER TIER 0)
            </button>
          </div>

          <button type="button" class="p5-aoa-trigger-btn" id="p5TriggerAoaBtn">
            💥 ALL-OUT ATTACK (NAT 20)
          </button>
        </div>
      </div>
    </div>
  `;
}

export function attachPersonaBattleDeckEvents(container: HTMLElement, char: Character): void {
  // If not awakened, attach wizard launcher
  const awakenPromptBtn = document.getElementById('p5DeckAwakenPromptBtn');
  if (awakenPromptBtn) {
    awakenPromptBtn.addEventListener('click', () => {
      personaWizardModal.open(char, () => {
        // Re-render sheet on awakening
        window.location.reload();
      });
    });
    return;
  }

  if (!char.persona) return;
  if (unbindDeckAudioBadge) unbindDeckAudioBadge();
  unbindDeckAudioBadge = bindPersonaAudioBadge('p5DeckAudioBadge');
  const pData = char.persona;
  const level = Math.max(1, Math.min(6, char.level || 1));
  const pb = getProficiencyBonus(level);
  const stats = calculatePersonaStats(char, pData.arcanaId, pData.worldChosenStat);

  // Command Button Handlers
  container.querySelectorAll('.p5-cmd-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const cmd = target.dataset.cmd;
      if (!cmd) return;

      if (cmd === 'persona') {
        selectedBattleCommand = selectedBattleCommand === 'persona' ? null : 'persona';
        const drawer = document.getElementById('p5SkillsDrawer');
        if (drawer) {
          drawer.style.display = selectedBattleCommand === 'persona' ? 'block' : 'none';
        }
        container.querySelectorAll('.p5-cmd-btn:not([data-cmd="guard"])').forEach((b) => b.classList.remove('selected'));
        if (selectedBattleCommand === 'persona') target.classList.add('selected');
        return;
      }

      if (cmd === 'attack') {
        selectedBattleCommand = 'attack';
        container.querySelectorAll('.p5-cmd-btn:not([data-cmd="guard"])').forEach((b) => b.classList.remove('selected'));
        target.classList.add('selected');

        // Roll basic sword melee attack
        diceRollerModal.show('d20', stats.str.mod + pb, 'SWORD ATTACK (Physical)');
        return;
      }

      if (cmd === 'gun') {
        const currentBullets = pData.gunBullets !== undefined ? pData.gunBullets : DEFAULT_MAX_BULLETS;
        if (currentBullets <= 0) {
          showToast('Magazine kosong! Reset encounter untuk reload.', 'warning');
          return;
        }

        selectedBattleCommand = 'gun';
        container.querySelectorAll('.p5-cmd-btn:not([data-cmd="guard"])').forEach((b) => b.classList.remove('selected'));
        target.classList.add('selected');

        // Decrement bullets
        pData.gunBullets = currentBullets - 1;
        await characterStore.runOptimisticUpdate(
          (draft) => {
            if (draft.persona) draft.persona.gunBullets = pData.gunBullets;
          },
          async () => {
            return await updateCharacterDirect(char.id, { persona: pData });
          }
        );

        const badge = document.getElementById('p5BulletBadge');
        if (badge) badge.textContent = `${pData.gunBullets}/${pData.maxGunBullets || DEFAULT_MAX_BULLETS}`;

        // Roll gun attack
        diceRollerModal.show('d20', stats.str.mod + pb, `GUN FIRE (Ammo: ${pData.gunBullets} left)`);
        return;
      }

      if (cmd === 'guard') {
        isGuardingActive = !isGuardingActive;
        target.classList.toggle('selected', isGuardingActive);
        const labelEl = target.querySelector('.p5-wedge-label');
        if (labelEl) {
          labelEl.innerHTML = isGuardingActive
            ? 'G<span class="p5-invert-letter">U</span>ARDING'
            : 'G<span class="p5-invert-letter">U</span>ARD';
        }
        showToast(isGuardingActive ? 'Memasang Stance Guard (+2 AC & resistensi)' : 'Menonaktifkan Guard', 'info');
        return;
      }

      if (cmd === 'item') {
        selectedBattleCommand = 'item';
        container.querySelectorAll('.p5-cmd-btn:not([data-cmd="guard"])').forEach((b) => b.classList.remove('selected'));
        target.classList.add('selected');
        showToast('Buka tab Inventory untuk memilih item battle!', 'info');
        return;
      }
    });
  });

  // Cast Spell Handlers
  container.querySelectorAll('.p5-cast-spell-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLElement;
      const spellId = target.dataset.spellId;
      if (!spellId) return;

      const spell = SPELL_BY_ID.get(spellId);
      if (!spell) return;

      const isFree = spell.tier === 0 && !turnUsedFreeSpell;
      const cost = isFree ? 0 : spell.spCost;

      if ((pData.currentSp || 0) < cost) {
        showToast('SP tidak mencukupi untuk menggunakan spell ini!', 'warning');
        return;
      }

      // Deduct SP
      pData.currentSp = Math.max(0, (pData.currentSp || 0) - cost);
      if (spell.tier === 0 && !turnUsedFreeSpell) {
        turnUsedFreeSpell = true;
      }

      await characterStore.runOptimisticUpdate(
        (draft) => {
          if (draft.persona) draft.persona.currentSp = pData.currentSp;
        },
        async () => {
          return await updateCharacterDirect(char.id, { persona: pData });
        }
      );

      // Launch dice roller
      const isPhys = spell.element === 'physical' || spell.element === 'gun';
      const mod = isPhys ? stats.str.mod : stats.mag.mod;
      diceRollerModal.show('d20', mod + pb, `SPELL: ${spell.name} (${cost} SP)`);

      showToast(`Menggunakan ${spell.name} (${cost} SP terpotong)`, 'success');
      // Refresh UI vitals
      const spCard = container.querySelector('.p5-vital-card .sp-label')?.parentElement?.querySelector('.p5-vital-nums');
      if (spCard) spCard.textContent = `${pData.currentSp} / ${toBattleMaxSp(char.vitals?.composureMax || 10)}`;
    });
  });

  // Encounter reload
  document.getElementById('p5ResetEncounterBtn')?.addEventListener('click', async () => {
    pData.gunBullets = pData.maxGunBullets || DEFAULT_MAX_BULLETS;
    turnUsedFreeSpell = false;
    await characterStore.runOptimisticUpdate(
      (draft) => {
        if (draft.persona) draft.persona.gunBullets = pData.gunBullets;
      },
      async () => {
        return await updateCharacterDirect(char.id, { persona: pData });
      }
    );
    const badge = document.getElementById('p5BulletBadge');
    if (badge) badge.textContent = `${pData.gunBullets}/${pData.maxGunBullets || DEFAULT_MAX_BULLETS}`;
    showToast('Encounter di-reset! Amunisi pistol terisi penuh (8/8).', 'success');
  });

  // Short rest recover tier 0 / minor SP
  document.getElementById('p5RestSpRecoverBtn')?.addEventListener('click', async () => {
    turnUsedFreeSpell = false;
    showToast('Short Rest diambil: cast Tier 0 siap digunakan kembali tanpa slot!', 'info');
  });

  // All-Out Attack Trigger
  document.getElementById('p5TriggerAoaBtn')?.addEventListener('click', () => {
    allOutAttackModal.open(char);
  });
}

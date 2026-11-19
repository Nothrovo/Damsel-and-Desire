// ============================================================================
// PersonaView — Dedicated Persona 5 Royal Hub & Compendium (/persona)
// ============================================================================

import { MAJOR_ARCANA, PERSONA_SPELLS, ELEMENT_METADATA } from '../data/personaData';
import { renderPersonaAudioBadge, bindPersonaAudioBadge } from '../utils/personaAudio';
import type { ElementType, ArcanaInfo, PersonaSpell } from '../types/persona';

let activeHubTab: 'tutorial' | 'arcana' | 'spells' = 'arcana';
let selectedElementFilter: ElementType | 'all' = 'all';
let searchQuery = '';
let unbindHubAudioBadge: (() => void) | null = null;

export async function renderPersonaView(): Promise<void> {
  const appContainer = document.getElementById('appMain');
  if (!appContainer) return;

  appContainer.innerHTML = `
    <div class="persona-p5-scope p5-hub-container" id="personaHubRoot">
      <!-- HERO BANNER -->
      <div class="p5-hub-hero">
        <h1 class="p5-hub-title">PERSONA COMPENDIUM</h1>
        <div style="font-size:1.1rem;color:var(--p5-yellow);letter-spacing:1px;margin-top:0.5rem;text-transform:uppercase;">
          THE REBELLIOUS SPIRIT OF HOUSEN ACADEMY // ARCHIVE &amp; RULES
        </div>
        <div style="margin-top:1rem;">
          ${renderPersonaAudioBadge('p5HubAudioBadge')}
        </div>
      </div>

      <!-- HUB NAVIGATION TABS -->
      <div class="p5-hub-nav-tabs">
        <button type="button" class="p5-hub-tab-btn ${activeHubTab === 'arcana' ? 'active' : ''}" data-hub-tab="arcana">
          🃏 22 MAJOR ARCANA
        </button>
        <button type="button" class="p5-hub-tab-btn ${activeHubTab === 'spells' ? 'active' : ''}" data-hub-tab="spells">
          📖 SPELL ENCYCLOPEDIA
        </button>
        <button type="button" class="p5-hub-tab-btn ${activeHubTab === 'tutorial' ? 'active' : ''}" data-hub-tab="tutorial">
          ⚔️ SYSTEM &amp; COMBAT RULES
        </button>
      </div>

      <!-- TAB CONTENT PANES -->
      <div id="p5HubTabContent">
        ${renderActiveTabContent()}
      </div>
    </div>
  `;

  attachHubEvents();
  if (unbindHubAudioBadge) unbindHubAudioBadge();
  unbindHubAudioBadge = bindPersonaAudioBadge('p5HubAudioBadge');
}

function renderActiveTabContent(): string {
  if (activeHubTab === 'arcana') {
    return `
      <div class="p5-arcana-cards-grid">
        ${MAJOR_ARCANA.map((arcana) => renderArcanaCard(arcana)).join('')}
      </div>
    `;
  }

  if (activeHubTab === 'spells') {
    const elements: (ElementType | 'all')[] = [
      'all', 'physical', 'gun', 'fire', 'ice', 'electric',
      'wind', 'psy', 'nuclear', 'bless', 'curse', 'almighty',
    ];

    const filteredSpells = PERSONA_SPELLS.filter((sp) => {
      const matchElem = selectedElementFilter === 'all' || sp.element === selectedElementFilter;
      const matchSearch =
        !searchQuery ||
        sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sp.effect.toLowerCase().includes(searchQuery.toLowerCase());
      return matchElem && matchSearch;
    });

    return `
      <div>
        <!-- Search & Filter Bar -->
        <div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem;align-items:center;">
          <input
            type="text"
            id="p5SpellSearchInput"
            class="p5-form-input"
            style="max-width:320px;"
            placeholder="Cari nama spell atau efek..."
            value="${searchQuery}"
          />
          <div style="display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${elements.map((elem) => `
              <button
                type="button"
                class="p5-encounter-btn p5-elem-filter-btn ${selectedElementFilter === elem ? 'selected' : ''}"
                data-elem="${elem}"
                style="padding:0.3rem 0.8rem;font-size:0.9rem;${selectedElementFilter === elem ? 'background:var(--p5-red);border-color:#fff;' : ''}"
              >
                ${elem === 'all' ? 'SEMUA' : `${ELEMENT_METADATA[elem].icon} ${elem.toUpperCase()}`}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Spells Grid -->
        <div class="p5-skills-grid">
          ${filteredSpells.map((sp) => {
            const meta = ELEMENT_METADATA[sp.element];
            return `
              <div class="p5-skill-card" style="cursor:default;">
                <div class="p5-skill-top">
                  <span class="p5-skill-name">
                    <span>${meta.icon}</span>
                    <span>${sp.name}</span>
                  </span>
                  <span class="p5-sp-cost-chip">
                    ${sp.spCost === 0 ? 'FREE (1st)' : `${sp.spCost} SP`}
                  </span>
                </div>
                <div class="p5-skill-desc">${sp.effect}</div>
                <div class="p5-skill-action-row">
                  <span>TIER ${sp.tier} // ${sp.actionType.toUpperCase().replace('_', ' ')} // ${sp.range || 'Ranged'}</span>
                  <span style="color:var(--p5-yellow);font-weight:700;">LV ${sp.unlockLevel}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Tutorial / System Rules
  return `
    <div style="background:var(--p5-jet);border:2px solid var(--p5-red);padding:2rem;box-shadow:6px 6px 0px #000;">
      <h2 style="font-family:var(--p5-font-display);font-size:2rem;color:var(--p5-red);letter-spacing:2px;margin-bottom:1rem;">
        PANDUAN MEKANIK PERSONA // DAMSEL &amp; DESIRE
      </h2>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:1.5rem;line-height:1.5;color:var(--p5-light-gray);">
        <div style="background:#000;border:1px solid #333;padding:1.25rem;">
          <h3 style="font-family:var(--p5-font-display);font-size:1.4rem;color:var(--p5-yellow);margin-bottom:0.5rem;">
            1. TIGA STAT INTI PERSONA
          </h3>
          <p><strong>Strength (STR):</strong> Diturunkan dari skor <em>Physique</em>. Dipakai untuk serangan fisik, tembakan pistol, dan kalkulasi DC fisik.</p>
          <p><strong>Magic (MAG):</strong> Diturunkan dari <em>Atribut Arcana</em> karakter + bonus Persona Growth (+2 di Lv1, +4 di Lv5, max 22).</p>
          <p><strong>Endurance (END):</strong> Diturunkan dari <em>Mind</em>. Berfungsi sebagai peredam biaya Composure/SP.</p>
        </div>

        <div style="background:#000;border:1px solid #333;padding:1.25rem;">
          <h3 style="font-family:var(--p5-font-display);font-size:1.4rem;color:var(--p5-yellow);margin-bottom:0.5rem;">
            2. SISTEM SP &amp; VITALS (×10)
          </h3>
          <p>Nilai HP dan SP pada Battle Deck ditampilkan dalam skala ×10 (misal: Composure 14 menjadi 140 SP, HP 12 menjadi 120 HP).</p>
          <p><strong>Steady (>50% SP):</strong> Semua Tier Spell siap dipakai normal.</p>
          <p><strong>Salting (≤50% SP):</strong> Membuka <em>Persona Surge</em> (+1 dadu damage terbesar) dan mengunci mantra puncak Tier IV–V.</p>
          <p><strong>Meltdown (0 SP):</strong> Karakter lumpuh secara Persona.</p>
        </div>

        <div style="background:#000;border:1px solid #333;padding:1.25rem;">
          <h3 style="font-family:var(--p5-font-display);font-size:1.4rem;color:var(--p5-yellow);margin-bottom:0.5rem;">
            3. AMUNISI PISTOL (GUN SYSTEM)
          </h3>
          <p>Setiap karakter dibekali 8 peluru per encounter. Tembakan mengonsumsi 1 peluru dan melancarkan serangan jarak jauh (d20 + STR + PB).</p>
          <p>Amunisi akan terisi ulang penuh (8/8) secara otomatis setiap kali encounter baru dimulai via tombol <em>RESET ENCOUNTER</em>.</p>
        </div>

        <div style="background:#000;border:1px solid #333;padding:1.25rem;">
          <h3 style="font-family:var(--p5-font-display);font-size:1.4rem;color:var(--p5-yellow);margin-bottom:0.5rem;">
            4. ALL-OUT ATTACK (AOA)
          </h3>
          <p>Hanya terpicu bila pemain mendapatkan <strong>Natural 20 murni</strong> pada Attack Roll. Seluruh rekan setim yang sadar mengorbankan Reaction untuk menyerang bersamaan secara otomatis telak.</p>
          <p>Bonus damage sekutu: <strong>+1d8</strong> (Lv 1–2), <strong>+1d10</strong> (Lv 3–4), dan <strong>+1d12</strong> (Lv 5–6) per orang.</p>
        </div>
      </div>
    </div>
  `;
}

function renderArcanaCard(arcana: ArcanaInfo): string {
  return `
    <div class="p5-arcana-full-card" data-arcana-id="${arcana.id}">
      <div>
        <div class="p5-arcana-full-num">${arcana.roman}</div>
        <div class="p5-arcana-full-name">${arcana.name}</div>
        <div class="p5-arcana-full-stat">STAT: ${arcana.primaryStat.toUpperCase()} // ${arcana.nameJp}</div>
        <div style="font-size:0.8rem;color:var(--p5-light-gray);margin-top:0.5rem;line-height:1.35;">
          "${arcana.theme}"
        </div>
      </div>

      <div style="margin-top:1rem;border-top:1px solid #333;padding-top:0.75rem;font-size:0.75rem;color:#888;">
        <div><strong>Resist Lv 3:</strong> ${arcana.progression.level3.elements.join(', ').toUpperCase()}</div>
        <div><strong>Immune Lv 5:</strong> ${arcana.progression.level5.element.toUpperCase()}</div>
        <div><strong>Resist Lv 6:</strong> ${arcana.progression.level6.element.toUpperCase()}</div>
      </div>
    </div>
  `;
}

function attachHubEvents(): void {
  const root = document.getElementById('personaHubRoot');
  if (!root) return;

  // Hub Tab switching
  root.querySelectorAll('.p5-hub-tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const tab = target.dataset.hubTab as 'tutorial' | 'arcana' | 'spells';
      if (!tab) return;
      activeHubTab = tab;

      root.querySelectorAll('.p5-hub-tab-btn').forEach((b) => b.classList.remove('active'));
      target.classList.add('active');

      const content = document.getElementById('p5HubTabContent');
      if (content) {
        content.innerHTML = renderActiveTabContent();
        attachHubEvents();
      }
    });
  });

  // Spell search input
  const searchInput = document.getElementById('p5SpellSearchInput') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value;
      const content = document.getElementById('p5HubTabContent');
      if (content) {
        content.innerHTML = renderActiveTabContent();
        attachHubEvents();
      }
    });
  }

  // Element filter buttons
  root.querySelectorAll('.p5-elem-filter-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      selectedElementFilter = target.dataset.elem as ElementType | 'all';
      const content = document.getElementById('p5HubTabContent');
      if (content) {
        content.innerHTML = renderActiveTabContent();
        attachHubEvents();
      }
    });
  });
}

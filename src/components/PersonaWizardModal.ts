// ============================================================================
// PersonaWizardModal — Awakening Ceremony Wizard (Persona 5 Royal Style)
// ============================================================================

import { MAJOR_ARCANA } from '../data/personaData';
import { createDefaultPersonaData } from '../rules/personaRules';
import { characterStore } from '../store/characterStore';
import { updateCharacterDirect } from '../api/characters';
import { showToast } from './Toast';
import type { ArcanaId, CharacterPersona } from '../types/persona';
import type { Character } from '../types';

class PersonaWizardModal {
  private activeChar: Character | null = null;
  private selectedArcanaId: ArcanaId = 'fool';
  private isOpen: boolean = false;
  private onAwakenedCallback?: (persona: CharacterPersona) => void;

  render(): string {
    return `
      <div id="personaWizardModal" class="p5-modal-root p5-modal-backdrop" style="display:none;">
        <div class="p5-wizard-card">
          <div class="p5-contract-heading">BREAK THE MASK — AWAKENING</div>
          <div class="p5-contract-quote">
            "I am thou... Thou art I...<br>
            Thou hast turned a vow into a bloodied oath.<br>
            Through the fires of rebellion, awaken thy true self!"
          </div>

          <div class="p5-form-group">
            <label class="p5-form-label">1. PILIH MAJOR ARCANA (SUMBER KEKUATAN BATIN)</label>
            <div class="p5-arcana-picker-grid" id="p5ArcanaGrid">
              ${MAJOR_ARCANA.map(
                (a) => `
                <div class="p5-arcana-tile ${a.id === 'fool' ? 'active' : ''}" data-arcana="${a.id}">
                  <span class="p5-arcana-tile-num">${a.roman}</span>
                  <span class="p5-arcana-tile-name">${a.name}</span>
                </div>
              `
              ).join('')}
            </div>
          </div>

          <div class="p5-form-group" id="p5ArcanaThemeInfo" style="font-size:0.85rem;color:var(--p5-yellow);margin-bottom:1rem;">
            <strong>The Fool:</strong> New beginnings, optimism, and a leap of faith (MAG Stat: Luck)
          </div>

          <div class="p5-form-group">
            <label class="p5-form-label" for="p5PersonaNameInput">2. NAMA PERSONA</label>
            <input type="text" id="p5PersonaNameInput" class="p5-form-input" placeholder="Contoh: Arsène, Carmen, Captain Kidd, Valkyrie..." maxlength="30" />
          </div>

          <div class="p5-form-group">
            <label class="p5-form-label" for="p5PersonaVisualInput">3. DESKRIPSI WUJUD PERSONA (VISUAL)</label>
            <textarea id="p5PersonaVisualInput" class="p5-form-input" rows="2" placeholder="Contoh: Sosok ksatria bayangan bersayap gagak dengan mantel beludru merah dan topeng perak..."></textarea>
          </div>

          <div class="p5-modal-btn-row">
            <button type="button" class="p5-encounter-btn" id="p5CancelWizardBtn">BATAL</button>
            <button type="button" class="p5-aoa-trigger-btn" id="p5ConfirmAwakenBtn">🔥 AWAKEN NOW</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    const modal = document.getElementById('personaWizardModal');
    if (!modal) return;

    // Arcana selection
    modal.querySelectorAll('.p5-arcana-tile').forEach((tile) => {
      tile.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const arcana = target.dataset.arcana as ArcanaId;
        if (!arcana) return;
        this.selectedArcanaId = arcana;

        modal.querySelectorAll('.p5-arcana-tile').forEach((t) => t.classList.remove('active'));
        target.classList.add('active');

        const info = MAJOR_ARCANA.find((a) => a.id === arcana);
        const infoEl = document.getElementById('p5ArcanaThemeInfo');
        if (info && infoEl) {
          infoEl.innerHTML = `<strong>${info.name} (${info.roman}):</strong> ${info.theme} (MAG Stat: ${info.primaryStat.toUpperCase()})`;
        }
      });
    });

    // Cancel
    document.getElementById('p5CancelWizardBtn')?.addEventListener('click', () => {
      this.close();
    });

    // Confirm Awakening
    document.getElementById('p5ConfirmAwakenBtn')?.addEventListener('click', async () => {
      await this.handleAwaken();
    });
  }

  open(char: Character, onAwakened?: (persona: CharacterPersona) => void): void {
    this.activeChar = char;
    this.onAwakenedCallback = onAwakened;
    this.selectedArcanaId = 'fool';
    this.isOpen = true;

    const modal = document.getElementById('personaWizardModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const nameInput = document.getElementById('p5PersonaNameInput') as HTMLInputElement;
    if (nameInput) nameInput.value = '';

    const visualInput = document.getElementById('p5PersonaVisualInput') as HTMLTextAreaElement;
    if (visualInput) visualInput.value = '';
  }

  close(): void {
    this.isOpen = false;
    const modal = document.getElementById('personaWizardModal');
    if (modal) modal.style.display = 'none';
  }

  private async handleAwaken(): Promise<void> {
    if (!this.activeChar) return;

    const nameInput = document.getElementById('p5PersonaNameInput') as HTMLInputElement;
    const visualInput = document.getElementById('p5PersonaVisualInput') as HTMLTextAreaElement;

    const personaName = nameInput?.value.trim() || 'Nameless Spirit';
    const personaVisual = visualInput?.value.trim() || 'Wujud manifestasi jiwa pemberontak.';

    const newPersonaData = createDefaultPersonaData(
      this.activeChar,
      this.selectedArcanaId,
      personaName,
      personaVisual
    );

    try {
      await characterStore.runOptimisticUpdate(
        (draft) => {
          draft.persona = newPersonaData;
        },
        async () => {
          return await updateCharacterDirect(this.activeChar!.id, {
            persona: newPersonaData,
          });
        }
      );

      showToast(`Persona ${personaName} telah bangkit! (Arcana ${this.selectedArcanaId.toUpperCase()})`, 'success');
      this.close();

      if (this.onAwakenedCallback) {
        this.onAwakenedCallback(newPersonaData);
      }
    } catch (err: any) {
      showToast(`Gagal membangkitkan Persona: ${err.message}`, 'error');
    }
  }
}

export const personaWizardModal = new PersonaWizardModal();

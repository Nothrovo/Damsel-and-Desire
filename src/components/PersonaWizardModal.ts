// ============================================================================
// PersonaWizardModal — Awakening Ceremony Wizard (Persona 5 Royal Style)
// Includes optional Persona Manifestation Photo Upload
// ============================================================================

import { MAJOR_ARCANA } from '../data/personaData';
import { createDefaultPersonaData } from '../rules/personaRules';
import { characterStore } from '../store/characterStore';
import { updateCharacterDirect } from '../api/characters';
import { uploadPersonaImage } from '../api/storage';
import { showToast } from './Toast';
import type { ArcanaId, CharacterPersona } from '../types/persona';
import type { Character } from '../types';

class PersonaWizardModal {
  private activeChar: Character | null = null;
  private selectedArcanaId: ArcanaId = 'fool';
  private pendingImageFile: File | null = null;
  private previewObjectUrl: string | null = null;
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
            <strong>The Fool:</strong> New beginnings, optimism, and a leap of faith (MAG Stat: LUCK)
          </div>

          <div class="p5-wizard-two-col">
            <div>
              <div class="p5-form-group">
                <label class="p5-form-label" for="p5PersonaNameInput">2. NAMA PERSONA</label>
                <input type="text" id="p5PersonaNameInput" class="p5-form-input" placeholder="Contoh: Arsène, Carmen, Thanatos, Valkyrie..." maxlength="30" />
              </div>

              <div class="p5-form-group">
                <label class="p5-form-label" for="p5PersonaVisualInput">3. DESKRIPSI WUJUD PERSONA (VISUAL)</label>
                <textarea id="p5PersonaVisualInput" class="p5-form-input" rows="3" placeholder="Contoh: Sosok ksatria bayangan bersayap gagak dengan mantel beludru merah dan topeng perak..."></textarea>
              </div>
            </div>

            <div class="p5-form-group">
              <label class="p5-form-label">4. FOTO / ILUSTRASI PERSONA (OPSIONAL)</label>
              <div class="p5-wizard-upload-box" id="p5WizardUploadBox" role="button" tabindex="0" aria-label="Unggah Foto Persona">
                <img id="p5WizardImgPreview" class="p5-wizard-img-preview" alt="Preview Persona" style="display:none;" />
                <div id="p5WizardImgPlaceholder" class="p5-wizard-img-placeholder">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>KLIK UNGGAH FOTO PERSONA</span>
                  <small>JPG / PNG / WEBP • Max 2MB</small>
                </div>
              </div>
              <input type="file" id="p5WizardImageInput" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;" />
              <button type="button" class="p5-encounter-btn" id="p5WizardClearImgBtn" style="display:none;width:100%;margin-top:0.5rem;font-size:0.85rem;padding:0.35rem;">
                HAPUS PILIHAN FOTO
              </button>
            </div>
          </div>

          <div class="p5-modal-btn-row">
            <button type="button" class="p5-encounter-btn" id="p5CancelWizardBtn">BATAL</button>
            <button type="button" class="p5-aoa-trigger-btn" id="p5ConfirmAwakenBtn">AWAKEN NOW</button>
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

    // Persona photo upload picker
    const uploadBox = document.getElementById('p5WizardUploadBox');
    const fileInput = document.getElementById('p5WizardImageInput') as HTMLInputElement | null;
    const clearBtn = document.getElementById('p5WizardClearImgBtn');

    uploadBox?.addEventListener('click', () => fileInput?.click());
    uploadBox?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput?.click();
      }
    });

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto Persona maksimal 2MB.', 'warning');
        fileInput.value = '';
        return;
      }
      this.pendingImageFile = file;
      if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = URL.createObjectURL(file);

      const previewImg = document.getElementById('p5WizardImgPreview') as HTMLImageElement | null;
      const placeholder = document.getElementById('p5WizardImgPlaceholder');
      if (previewImg) {
        previewImg.src = this.previewObjectUrl;
        previewImg.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
      if (clearBtn) clearBtn.style.display = 'block';
    });

    clearBtn?.addEventListener('click', () => {
      this.resetImageSelection();
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

  private resetImageSelection(): void {
    this.pendingImageFile = null;
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
    const fileInput = document.getElementById('p5WizardImageInput') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
    const previewImg = document.getElementById('p5WizardImgPreview') as HTMLImageElement | null;
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    const placeholder = document.getElementById('p5WizardImgPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
    const clearBtn = document.getElementById('p5WizardClearImgBtn');
    if (clearBtn) clearBtn.style.display = 'none';
  }

  open(char: Character, onAwakened?: (persona: CharacterPersona) => void): void {
    this.activeChar = char;
    this.onAwakenedCallback = onAwakened;
    this.selectedArcanaId = 'fool';
    this.isOpen = true;
    this.resetImageSelection();

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
    this.resetImageSelection();
    const modal = document.getElementById('personaWizardModal');
    if (modal) modal.style.display = 'none';
  }

  private async handleAwaken(): Promise<void> {
    if (!this.activeChar) return;

    const confirmBtn = document.getElementById('p5ConfirmAwakenBtn') as HTMLButtonElement | null;
    const nameInput = document.getElementById('p5PersonaNameInput') as HTMLInputElement;
    const visualInput = document.getElementById('p5PersonaVisualInput') as HTMLTextAreaElement;

    const personaName = nameInput?.value.trim() || 'Nameless Spirit';
    const personaVisual = visualInput?.value.trim() || 'Wujud manifestasi jiwa pemberontak.';

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'MEMBANGKITKAN...';
    }

    let personaImagePath = '';
    try {
      if (this.pendingImageFile) {
        personaImagePath = await uploadPersonaImage(this.pendingImageFile, this.activeChar.id);
      }

      const newPersonaData = createDefaultPersonaData(
        this.activeChar,
        this.selectedArcanaId,
        personaName,
        personaVisual,
        personaImagePath
      );

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
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'AWAKEN NOW';
      }
    }
  }
}

export const personaWizardModal = new PersonaWizardModal();

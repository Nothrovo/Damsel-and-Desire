// ============================================================================
// AllOutAttackModal — Dramatic Persona 5 Royal Finisher Screen
// ============================================================================

import { getAoaAllyDie } from '../rules/personaRules';
import { diceRollerModal } from './DiceRollerModal';
import type { Character } from '../types';

class AllOutAttackModal {
  private activeChar: Character | null = null;

  render(): string {
    return `
      <div id="allOutAttackModal" class="p5-modal-root p5-aoa-screen" style="display:none;">
        <div class="p5-aoa-stripes"></div>

        <div class="p5-aoa-header">
          <h1 class="p5-aoa-headline">THE SHOW'S OVER</h1>
          <p style="font-size:1.2rem;font-weight:700;color:#fff;letter-spacing:2px;margin:0.5rem 0;text-transform:uppercase;">
            ALL-OUT ATTACK // FINISHER EXECUTION
          </p>
        </div>

        <div class="p5-aoa-body">
          <div style="font-family:var(--p5-font-display);font-size:1.4rem;color:#fff;letter-spacing:1px;">
            KONDISI CRITICAL HIT (NATURAL 20)!
          </div>
          <p style="font-size:0.9rem;color:var(--p5-light-gray);line-height:1.4;margin:0.5rem 0;">
            Semua sekutu yang sadar bergerak bersama menggunakan Reaction mereka untuk menerjang target sekaligus secara telak tanpa Attack Roll!
          </p>

          <div class="p5-aoa-dice-box" id="p5AoaBonusDisplay">
            BONUS DAMAGE: +3× (1d8) ALLY DICE
          </div>

          <div style="display:flex;gap:0.75rem;margin-top:1rem;flex-wrap:wrap;">
            <button type="button" class="p5-aoa-trigger-btn" id="p5RollAoaBtn">
              🎲 ROLL FINISHER DAMAGE
            </button>
            <button type="button" class="p5-aoa-close-btn" id="p5CloseAoaBtn">
              KEMBALI KE DECK
            </button>
          </div>
        </div>

        <div style="position:relative;z-index:2;font-family:var(--p5-font-display);font-size:1rem;color:rgba(255,255,255,0.7);letter-spacing:2px;">
          PHANTOM THIEVES OF HEARTS // DAMSEL &amp; DESIRE
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    document.getElementById('p5CloseAoaBtn')?.addEventListener('click', () => {
      this.close();
    });

    document.getElementById('p5RollAoaBtn')?.addEventListener('click', () => {
      if (!this.activeChar) return;
      const die = getAoaAllyDie(this.activeChar.level || 1);
      this.close();
      // Open existing dice roller modal with AOA prompt
      diceRollerModal.show(die, 0, `ALL-OUT ATTACK FINISHER (+${die} per ally)`);
    });
  }

  open(char: Character): void {
    this.activeChar = char;
    const modal = document.getElementById('allOutAttackModal');
    if (!modal) return;

    const die = getAoaAllyDie(char.level || 1);
    const bonusDisplay = document.getElementById('p5AoaBonusDisplay');
    if (bonusDisplay) {
      bonusDisplay.textContent = `BONUS KERUSAKAN SEKUTU: +${die} per orang`;
    }

    modal.style.display = 'flex';
  }

  close(): void {
    const modal = document.getElementById('allOutAttackModal');
    if (modal) modal.style.display = 'none';
  }
}

export const allOutAttackModal = new AllOutAttackModal();

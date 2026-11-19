// ============================================================================
// AllOutAttackModal — Persona 5 Royal Finisher Screen + Joker MV Playback
// ============================================================================

import { getAoaAllyDie, scaleDiceExpression } from '../rules/personaRules';
import { diceRollerModal } from './DiceRollerModal';
import { personaAudio } from '../utils/personaAudio';
import type { Character } from '../types';

const JOKER_AOA_PRIMARY_YT_ID = 'HsEq5zY4ucM';  // Persona 5 Royal Joker's ALL OUT ATTACK (17s)
const JOKER_AOA_FALLBACK_YT_ID = 'O5sJecqvFsE'; // Joker's All Out Attack (16s)

class AllOutAttackModal {
  private activeChar: Character | null = null;
  private allyCount: number = 3;
  private activeVideoId: string = JOKER_AOA_PRIMARY_YT_ID;
  private mvTimer: ReturnType<typeof setTimeout> | null = null;
  private wasBgmPlaying: boolean = false;

  render(): string {
    return `
      <div id="allOutAttackModal" class="p5-modal-root p5-aoa-screen" style="display:none;" role="dialog" aria-modal="true" aria-labelledby="p5AoaHeadline">
        <div class="p5-aoa-stripes"></div>

        <!-- Clean, Non-Overlapping Header -->
        <div class="p5-aoa-header">
          <h1 class="p5-aoa-headline" id="p5AoaHeadline">THE SHOW'S OVER</h1>
          <div class="p5-aoa-subtitle-ribbon">
            ALL-OUT ATTACK // FINISHER EXECUTION
          </div>
        </div>

        <!-- Balanced Center Stage -->
        <div class="p5-aoa-stage-grid" id="p5AoaPrepStage">
          <div class="p5-aoa-body">
            <div class="p5-aoa-kicker">KONDISI CRITICAL HIT (NATURAL 20)!</div>
            <p class="p5-aoa-desc">
              Semua sekutu yang sadar bergerak serentak menggunakan Reaction mereka untuk menerjang target sekaligus secara telak tanpa Attack Roll!
            </p>

            <!-- Ally Count Selector -->
            <div class="p5-aoa-ally-picker">
              <span class="p5-aoa-ally-label">JUMLAH SEKUTU IKUT MENYERANG:</span>
              <div class="p5-aoa-ally-pills" id="p5AoaAllyPills">
                <button type="button" class="p5-aoa-ally-btn" data-allies="1">1 SEKUTU</button>
                <button type="button" class="p5-aoa-ally-btn" data-allies="2">2 SEKUTU</button>
                <button type="button" class="p5-aoa-ally-btn active" data-allies="3">3 SEKUTU</button>
                <button type="button" class="p5-aoa-ally-btn" data-allies="4">4 SEKUTU</button>
              </div>
            </div>

            <div class="p5-aoa-dice-box" id="p5AoaBonusDisplay">
              TOTAL FINISHER DICE: 3d8 (+1d8 × 3 SEKUTU)
            </div>

            <div class="p5-aoa-actions">
              <button type="button" class="p5-aoa-trigger-btn" id="p5RollAoaBtn">
                ROLL FINISHER DAMAGE (3d8)
              </button>
              <button type="button" class="p5-aoa-close-btn" id="p5CloseAoaBtn">
                KEMBALI KE DECK
              </button>
            </div>
          </div>

          <div class="p5-aoa-callout-panel" aria-hidden="true">
            <div class="p5-aoa-star-emblem">
              <span class="p5-aoa-star-text">FINISH<br>THEM!</span>
            </div>
            <div class="p5-aoa-callout-note">
              Setelah roll damage selesai, cutscene <strong>Joker All-Out Attack</strong> akan langsung diputar!
            </div>
          </div>
        </div>

        <!-- Cinematic MV Playback Overlay (Shown Right After Rolling Finisher Damage) -->
        <div class="p5-aoa-mv-stage" id="p5AoaMvStage" style="display:none;">
          <div class="p5-aoa-mv-topbar">
            <div class="p5-aoa-mv-damage-badge" id="p5AoaMvDamageBadge">
              TOTAL FINISHER DAMAGE: 0
            </div>
            <div class="p5-aoa-mv-controls">
              <button type="button" class="p5-encounter-btn" id="p5AoaSwitchVideoBtn" style="font-size:0.9rem;padding:0.4rem 0.9rem;">
                GANTI SUMBER VIDEO
              </button>
              <button type="button" class="p5-aoa-close-btn" id="p5AoaSkipMvBtn" style="font-size:1.1rem;padding:0.45rem 1.4rem;">
                SELESAI / KEMBALI KE DECK
              </button>
            </div>
          </div>
          <div class="p5-aoa-mv-frame-wrap" id="p5AoaMvFrameWrap"></div>
        </div>

        <div class="p5-aoa-footer">
          PHANTOM THIEVES OF HEARTS // DAMSEL &amp; DESIRE
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    document.getElementById('p5CloseAoaBtn')?.addEventListener('click', () => {
      this.close();
    });

    document.getElementById('p5AoaSkipMvBtn')?.addEventListener('click', () => {
      this.close();
    });

    document.getElementById('p5AoaSwitchVideoBtn')?.addEventListener('click', () => {
      this.activeVideoId =
        this.activeVideoId === JOKER_AOA_PRIMARY_YT_ID
          ? JOKER_AOA_FALLBACK_YT_ID
          : JOKER_AOA_PRIMARY_YT_ID;
      this.mountYoutubeIframe();
    });

    document.querySelectorAll('#p5AoaAllyPills .p5-aoa-ally-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const count = Number((e.currentTarget as HTMLElement).dataset.allies) || 3;
        this.allyCount = Math.max(1, Math.min(4, count));
        document.querySelectorAll('#p5AoaAllyPills .p5-aoa-ally-btn').forEach((b) => {
          b.classList.toggle('active', Number((b as HTMLElement).dataset.allies) === this.allyCount);
        });
        this.updateBonusDisplay();
      });
    });

    document.getElementById('p5RollAoaBtn')?.addEventListener('click', () => {
      if (!this.activeChar) return;
      const singleDie = getAoaAllyDie(this.activeChar.level || 1);
      const totalDice = scaleDiceExpression(singleDie, this.allyCount);

      diceRollerModal.showAction({
        title: `ALL-OUT ATTACK FINISHER (${this.allyCount} Sekutu)`,
        subtitle: `Persona 5 Royal Critical Finisher • ${singleDie} per sekutu`,
        theme: 'persona',
        steps: [
          {
            id: 'damage',
            label: 'Finisher Damage',
            dice: totalDice,
            mod: 0,
            subtitle: 'Almighty Finisher — Tanpa Attack Roll!',
          },
        ],
        onRollComplete: (result) => {
          // Give the player 700ms to see their massive roll total, then launch Joker's All-Out Attack MV!
          if (this.mvTimer) clearTimeout(this.mvTimer);
          this.mvTimer = setTimeout(() => {
            diceRollerModal.hide();
            this.playJokerMv(result.total, result.dice);
          }, 700);
        },
      });
    });
  }

  private updateBonusDisplay(): void {
    const level = this.activeChar?.level || 1;
    const singleDie = getAoaAllyDie(level);
    const totalDice = scaleDiceExpression(singleDie, this.allyCount);

    const bonusDisplay = document.getElementById('p5AoaBonusDisplay');
    if (bonusDisplay) {
      bonusDisplay.textContent = `TOTAL FINISHER DICE: ${totalDice} (+${singleDie} × ${this.allyCount} SEKUTU)`;
    }

    const rollBtn = document.getElementById('p5RollAoaBtn');
    if (rollBtn) {
      rollBtn.textContent = `ROLL FINISHER DAMAGE (${totalDice})`;
    }
  }

  private mountYoutubeIframe(): void {
    const wrap = document.getElementById('p5AoaMvFrameWrap');
    if (!wrap) return;
    const src = `https://www.youtube-nocookie.com/embed/${this.activeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    wrap.innerHTML = `
      <iframe
        class="p5-aoa-mv-iframe"
        src="${src}"
        title="Persona 5 Royal Joker All-Out Attack"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    `;
  }

  private playJokerMv(totalDamage: number, diceUsed: string): void {
    const modal = document.getElementById('allOutAttackModal');
    const prepStage = document.getElementById('p5AoaPrepStage');
    const mvStage = document.getElementById('p5AoaMvStage');
    const badge = document.getElementById('p5AoaMvDamageBadge');

    if (!modal || !mvStage) return;

    // Pause Battle BGM while Joker's All-Out Attack MV plays so audio doesn't clash
    this.wasBgmPlaying = personaAudio.getState().currentTrack === 'battle';
    if (this.wasBgmPlaying) {
      personaAudio.stop(180);
    }

    if (badge) {
      badge.textContent = `THE SHOW'S OVER // TOTAL FINISHER DAMAGE: ${totalDamage} (${diceUsed})`;
    }
    if (prepStage) prepStage.style.display = 'none';
    mvStage.style.display = 'flex';
    modal.style.display = 'flex';
    this.mountYoutubeIframe();
  }

  open(char: Character): void {
    this.activeChar = char;
    this.allyCount = 3;
    this.activeVideoId = JOKER_AOA_PRIMARY_YT_ID;

    const modal = document.getElementById('allOutAttackModal');
    const prepStage = document.getElementById('p5AoaPrepStage');
    const mvStage = document.getElementById('p5AoaMvStage');
    const wrap = document.getElementById('p5AoaMvFrameWrap');
    if (!modal) return;

    if (wrap) wrap.innerHTML = '';
    if (mvStage) mvStage.style.display = 'none';
    if (prepStage) prepStage.style.display = 'grid';

    document.querySelectorAll('#p5AoaAllyPills .p5-aoa-ally-btn').forEach((b) => {
      b.classList.toggle('active', Number((b as HTMLElement).dataset.allies) === this.allyCount);
    });

    this.updateBonusDisplay();
    modal.style.display = 'flex';
  }

  close(): void {
    if (this.mvTimer) {
      clearTimeout(this.mvTimer);
      this.mvTimer = null;
    }

    const wrap = document.getElementById('p5AoaMvFrameWrap');
    if (wrap) wrap.innerHTML = '';

    const mvStage = document.getElementById('p5AoaMvStage');
    if (mvStage) mvStage.style.display = 'none';

    const prepStage = document.getElementById('p5AoaPrepStage');
    if (prepStage) prepStage.style.display = 'grid';

    const modal = document.getElementById('allOutAttackModal');
    if (modal) modal.style.display = 'none';

    // Resume Battle BGM if it was playing before MV
    if (this.wasBgmPlaying) {
      this.wasBgmPlaying = false;
      void personaAudio.play('battle');
    }
  }
}

export const allOutAttackModal = new AllOutAttackModal();

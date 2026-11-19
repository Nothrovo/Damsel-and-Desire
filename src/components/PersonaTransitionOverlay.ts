// ============================================================================
// PersonaTransitionOverlay — Persona 5 Royal Open/Close/Awakening Transitions
// ============================================================================

function getJokerMaskSrc(): string {
  try {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL || '/';
    const normalized = base.endsWith('/') ? base : `${base}/`;
    return `${normalized}assets/joker-mask.png`;
  } catch {
    return '/assets/joker-mask.png';
  }
}

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
}

/** Generate deterministic + organic rising ember particles for the awakening fire effect */
function renderEmbers(count: number): string {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.round(((i + 0.5) / count) * 96 + (Math.random() * 6 - 3));
    const delay = Math.round(Math.random() * 420);
    const duration = 680 + Math.round(Math.random() * 320);
    const size = 4 + Math.round(Math.random() * 6);
    const drift = Math.round(Math.random() * 60 - 30);
    const isCrimson = i % 3 === 0;
    html += `<span class="p5-awaken-ember ${isCrimson ? 'is-crimson' : ''}" style="left:${Math.max(2, Math.min(98, left))}%;bottom:-12px;width:${size}px;height:${size}px;animation-delay:${delay}ms;animation-duration:${duration}ms;--ember-drift:${drift}px;"></span>`;
  }
  return html;
}

export type TransitionMode = 'open' | 'close' | 'awakening';

export class PersonaTransitionOverlay {
  private isRunning = false;
  private timers: ReturnType<typeof setTimeout>[] = [];

  render(): string {
    const maskSrc = getJokerMaskSrc();
    return `
      <div id="p5TransitionOverlay" class="p5-transition-overlay" aria-hidden="true">
        <div class="p5-trans-backdrop"></div>
        <div class="p5-trans-starburst"></div>
        <div class="p5-trans-starburst-inner"></div>
        <div class="p5-trans-slash-bar">
          <span class="p5-trans-slash-text" id="p5TransSlashText">SHOWTIME!</span>
        </div>
        <div class="p5-trans-mask-stage">
          <img src="${maskSrc}" alt="" class="p5-trans-mask-img" />
        </div>

        <!-- First-Awakening Rising Spirit Fire Stage (hidden unless mode-awakening) -->
        <div class="p5-awaken-stage">
          <div class="p5-awaken-backdrop"></div>
          <!-- Back Layer: Roaring Crimson Rebellion Flame Curtain -->
          <div class="p5-awaken-flame-layer p5-awaken-flame-1">
            <svg viewBox="0 0 1440 900" preserveAspectRatio="none" class="p5-awaken-flame-svg">
              <defs>
                <linearGradient id="p5FlameGrad1" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="#2b0006" />
                  <stop offset="35%" stop-color="#9e0010" />
                  <stop offset="72%" stop-color="#e60012" />
                  <stop offset="100%" stop-color="#ff3b4e" />
                </linearGradient>
              </defs>
              <path fill="url(#p5FlameGrad1)" d="M0,900 L0,430 Q35,280 78,160 Q110,275 150,355 Q195,180 242,72 Q278,215 322,310 Q370,130 428,28 Q465,195 512,300 Q568,140 622,55 Q668,210 715,320 Q770,115 825,22 Q875,185 928,295 Q982,135 1038,48 Q1090,205 1142,315 Q1198,125 1255,38 Q1305,205 1358,325 Q1400,210 1440,145 L1440,900 Z" />
            </svg>
          </div>
          <!-- Mid Layer: Canon Persona 5 Electric Blue / Cyan Spiritual Fire -->
          <div class="p5-awaken-flame-layer p5-awaken-flame-2">
            <svg viewBox="0 0 1440 900" preserveAspectRatio="none" class="p5-awaken-flame-svg">
              <defs>
                <linearGradient id="p5FlameGrad2" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="#001d4a" />
                  <stop offset="30%" stop-color="#0077cc" />
                  <stop offset="68%" stop-color="#00d4ff" />
                  <stop offset="92%" stop-color="#7ef9ff" />
                  <stop offset="100%" stop-color="#ff2a40" />
                </linearGradient>
              </defs>
              <path fill="url(#p5FlameGrad2)" d="M0,900 L0,480 Q48,300 105,195 Q142,315 190,405 Q245,215 308,95 Q352,265 402,360 Q462,165 524,62 Q575,235 628,350 Q690,155 752,48 Q808,230 865,345 Q925,170 985,78 Q1040,255 1098,370 Q1158,180 1222,72 Q1278,255 1335,380 Q1388,245 1440,185 L1440,900 Z" />
            </svg>
          </div>
          <!-- Front Layer: White-Hot Cyan Plasma Core & Noir Contrast Rim -->
          <div class="p5-awaken-flame-layer p5-awaken-flame-3">
            <svg viewBox="0 0 1440 900" preserveAspectRatio="none" class="p5-awaken-flame-svg">
              <defs>
                <linearGradient id="p5FlameGrad3" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stop-color="#040814" stop-opacity="0.92" />
                  <stop offset="38%" stop-color="#0055aa" stop-opacity="0.72" />
                  <stop offset="76%" stop-color="#00f0ff" stop-opacity="0.82" />
                  <stop offset="96%" stop-color="#e0ffff" stop-opacity="0.95" />
                  <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
                </linearGradient>
              </defs>
              <path fill="url(#p5FlameGrad3)" d="M0,900 L0,590 Q65,420 138,315 Q190,460 250,535 Q318,355 390,235 Q448,410 512,510 Q585,320 660,210 Q725,395 795,505 Q868,315 942,225 Q1008,415 1078,520 Q1152,340 1225,245 Q1290,425 1362,535 Q1405,440 1440,360 L1440,900 Z" />
            </svg>
          </div>
          <div class="p5-awaken-embers" id="p5AwakenEmbers"></div>
          <div class="p5-awaken-center">
            <img src="${maskSrc}" alt="" class="p5-awaken-mask-img" />
            <div class="p5-awaken-text" id="p5AwakenText">I AM THOU…</div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents(): void {
    // Purely programmatic overlay — no persistent click handlers required.
  }

  isActive(): boolean {
    return this.isRunning;
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  private resetClasses(el: HTMLElement): void {
    el.classList.remove(
      'is-active',
      'mode-open',
      'mode-close',
      'mode-awakening',
      'phase-in',
      'phase-out'
    );
  }

  /**
   * Plays the Persona 5 transition:
   * - 'open': expands dramatically from small -> big with P5 crimson starburst + Joker mask zoom.
   * - 'close': contracts dramatically from big -> small with reverse crimson collapse.
   * - 'awakening': first-time special — blue electric flames rising bottom→top with "I AM THOU" text.
   */
  play(
    mode: TransitionMode,
    onMidpoint: () => void,
    onComplete?: () => void
  ): void {
    if (this.isRunning) return;

    const overlay = document.getElementById('p5TransitionOverlay');
    if (!overlay || prefersReducedMotion()) {
      onMidpoint();
      onComplete?.();
      return;
    }

    this.isRunning = true;
    this.clearTimers();

    if (mode === 'awakening') {
      // Inject rising spirit ember particles
      const embersContainer = document.getElementById('p5AwakenEmbers');
      if (embersContainer) embersContainer.innerHTML = renderEmbers(22);

      const awakenText = document.getElementById('p5AwakenText');
      if (awakenText) awakenText.textContent = 'I AM THOU…';

      this.resetClasses(overlay);
      void overlay.offsetWidth;
      overlay.classList.add('is-active', 'mode-awakening', 'phase-in');

      const midMs = 520;
      const totalMs = 980;

      const tTextSwitch = setTimeout(() => {
        if (awakenText) awakenText.textContent = 'AWAKEN!';
      }, 310);

      const tMid = setTimeout(() => {
        onMidpoint();
        overlay.classList.remove('phase-in');
        overlay.classList.add('phase-out');
      }, midMs);

      const tEnd = setTimeout(() => {
        this.resetClasses(overlay);
        if (embersContainer) embersContainer.innerHTML = '';
        this.isRunning = false;
        onComplete?.();
      }, totalMs);

      this.timers.push(tTextSwitch, tMid, tEnd);
      return;
    }

    // Standard open/close modes
    const slashText = document.getElementById('p5TransSlashText');
    if (slashText) {
      slashText.textContent = mode === 'open' ? 'SHOWTIME!' : 'MASK ON';
    }

    this.resetClasses(overlay);
    void overlay.offsetWidth;

    overlay.classList.add('is-active', mode === 'open' ? 'mode-open' : 'mode-close', 'phase-in');

    const midpointMs = mode === 'open' ? 290 : 250;
    const totalMs = mode === 'open' ? 660 : 540;

    const tMid = setTimeout(() => {
      onMidpoint();
      overlay.classList.remove('phase-in');
      overlay.classList.add('phase-out');
    }, midpointMs);

    const tEnd = setTimeout(() => {
      this.resetClasses(overlay);
      this.isRunning = false;
      onComplete?.();
    }, totalMs);

    this.timers.push(tMid, tEnd);
  }
}

export const personaTransitionOverlay = new PersonaTransitionOverlay();

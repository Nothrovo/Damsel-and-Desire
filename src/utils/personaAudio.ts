// ============================================================================
// PersonaAudioManager — Auto-Loop BGM Engine for Persona 5 Battle Deck & Hub
// ============================================================================

export type PersonaTrackId = 'battle' | 'leblanc';

export interface PersonaTrackMeta {
  id: PersonaTrackId;
  title: string;
  subtitle: string;
  fileName: string;
  targetVolume: number;
}

export interface PersonaAudioState {
  currentTrack: PersonaTrackId | null;
  isPlaying: boolean;
  isMuted: boolean;
  autoplayBlocked: boolean;
  meta: PersonaTrackMeta | null;
}

export interface AudioElementLike {
  src: string;
  loop: boolean;
  volume: number;
  currentTime: number;
  paused: boolean;
  preload: string;
  play(): Promise<void>;
  pause(): void;
}

const MUTE_STORAGE_KEY = 'damsel_persona_bgm_muted';

export const PERSONA_TRACKS: Record<PersonaTrackId, PersonaTrackMeta> = {
  battle: {
    id: 'battle',
    title: 'Last Surprise',
    subtitle: 'BATTLE BGM',
    fileName: 'audio/last-surprise.mp3',
    targetVolume: 0.36,
  },
  leblanc: {
    id: 'leblanc',
    title: 'Beneath the Mask',
    subtitle: 'CAFE LEBLANC',
    fileName: 'audio/beneath-the-mask-leblanc.mp3',
    targetVolume: 0.34,
  },
};

function getBaseUrl(): string {
  try {
    const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL;
    if (base) return base.endsWith('/') ? base : `${base}/`;
  } catch {
    // Fallback for non-Vite environments
  }
  return '/';
}

function readStoredMute(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeStoredMute(muted: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false');
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

export class PersonaAudioManager {
  private audioFactory: (src: string) => AudioElementLike;
  private activeAudio: AudioElementLike | null = null;
  private activeTrackId: PersonaTrackId | null = null;
  private isMuted: boolean;
  private autoplayBlocked = false;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private pendingUnlockTrack: PersonaTrackId | null = null;
  private unlockListenerBound: (() => void) | null = null;
  private listeners = new Set<(state: PersonaAudioState) => void>();

  constructor(audioFactory?: (src: string) => AudioElementLike) {
    this.isMuted = readStoredMute();
    this.audioFactory =
      audioFactory ||
      ((src: string) => {
        const el = new Audio(src);
        el.preload = 'auto';
        return el;
      });
  }

  getState(): PersonaAudioState {
    const meta = this.activeTrackId ? PERSONA_TRACKS[this.activeTrackId] : null;
    return {
      currentTrack: this.activeTrackId,
      isPlaying: Boolean(this.activeAudio && !this.activeAudio.paused && !this.autoplayBlocked),
      isMuted: this.isMuted,
      autoplayBlocked: this.autoplayBlocked,
      meta,
    };
  }

  subscribe(listener: (state: PersonaAudioState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.warn('PersonaAudioManager listener error:', err);
      }
    });
  }

  private clearFade(): void {
    if (this.fadeTimer !== null) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }
  }

  private removeUnlockListener(): void {
    if (this.unlockListenerBound && typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', this.unlockListenerBound);
      document.removeEventListener('keydown', this.unlockListenerBound);
    }
    this.unlockListenerBound = null;
    this.pendingUnlockTrack = null;
  }

  private fadeVolume(
    audio: AudioElementLike,
    from: number,
    to: number,
    durationMs: number,
    onDone?: () => void
  ): void {
    this.clearFade();
    if (durationMs <= 0) {
      audio.volume = Math.max(0, Math.min(1, to));
      onDone?.();
      return;
    }

    const steps = Math.max(1, Math.round(durationMs / 25));
    let currentStep = 0;
    audio.volume = Math.max(0, Math.min(1, from));

    this.fadeTimer = setInterval(() => {
      currentStep += 1;
      const ratio = Math.min(1, currentStep / steps);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * ratio));
      if (ratio >= 1) {
        this.clearFade();
        onDone?.();
      }
    }, 25);
  }

  async play(trackId: PersonaTrackId): Promise<void> {
    const meta = PERSONA_TRACKS[trackId];
    if (!meta) return;

    // Already playing this exact track
    if (this.activeTrackId === trackId && this.activeAudio && !this.activeAudio.paused) {
      return;
    }

    // Stop any previous track cleanly before switching
    this.stopImmediate();

    const src = `${getBaseUrl()}${meta.fileName}`;
    const audio = this.audioFactory(src);
    audio.loop = true;
    audio.currentTime = 0;
    audio.volume = this.isMuted ? 0 : 0.01;

    this.activeAudio = audio;
    this.activeTrackId = trackId;
    this.autoplayBlocked = false;

    try {
      await audio.play();
      // Guard against stop() having been called while play() was resolving
      if (this.activeAudio !== audio) {
        audio.pause();
        return;
      }
      if (!this.isMuted) {
        this.fadeVolume(audio, 0.01, meta.targetVolume, 360);
      } else {
        audio.volume = 0;
      }
      this.emit();
    } catch {
      // Browser autoplay restriction (e.g., direct URL refresh onto /persona)
      if (this.activeAudio !== audio) return;
      this.autoplayBlocked = true;
      this.pendingUnlockTrack = trackId;
      this.bindAutoplayUnlock();
      this.emit();
    }
  }

  private bindAutoplayUnlock(): void {
    if (this.unlockListenerBound || typeof document === 'undefined') return;
    this.unlockListenerBound = () => {
      const target = this.pendingUnlockTrack;
      this.removeUnlockListener();
      if (target && this.activeTrackId === target) {
        void this.play(target);
      }
    };
    document.addEventListener('pointerdown', this.unlockListenerBound, { once: true });
    document.addEventListener('keydown', this.unlockListenerBound, { once: true });
  }

  stop(fadeOutMs: number = 280): void {
    this.removeUnlockListener();
    const audio = this.activeAudio;
    this.activeAudio = null;
    this.activeTrackId = null;
    this.autoplayBlocked = false;

    if (!audio) {
      this.emit();
      return;
    }

    const startVol = audio.volume;
    if (fadeOutMs <= 0 || startVol <= 0.01 || audio.paused) {
      this.clearFade();
      audio.pause();
      audio.currentTime = 0;
      this.emit();
      return;
    }

    this.fadeVolume(audio, startVol, 0, fadeOutMs, () => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.emit();
  }

  stopImmediate(): void {
    this.stop(0);
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    writeStoredMute(this.isMuted);

    if (this.activeAudio && this.activeTrackId) {
      const targetVol = PERSONA_TRACKS[this.activeTrackId].targetVolume;
      if (this.isMuted) {
        this.clearFade();
        this.activeAudio.volume = 0;
      } else {
        if (this.autoplayBlocked) {
          void this.play(this.activeTrackId);
          return this.isMuted;
        }
        this.fadeVolume(this.activeAudio, this.activeAudio.volume, targetVol, 200);
      }
    }

    this.emit();
    return this.isMuted;
  }

  resumeIfBlocked(): void {
    if (this.autoplayBlocked && this.activeTrackId) {
      const target = this.activeTrackId;
      this.removeUnlockListener();
      void this.play(target);
    }
  }
}

export const personaAudio = new PersonaAudioManager();

export function renderPersonaAudioBadge(containerId: string = 'p5AudioBadge'): string {
  const state = personaAudio.getState();
  const trackName = state.meta?.title || 'PERSONA BGM';
  const trackSub = state.meta?.subtitle || 'BGM';
  const mutedClass = state.isMuted ? 'is-muted' : '';
  const blockedClass = state.autoplayBlocked ? 'is-blocked' : '';
  const statusLabel = state.autoplayBlocked
    ? 'KLIK UNTUK PUTAR BGM'
    : state.isMuted
      ? 'BGM MUTED'
      : `${trackSub} // ${trackName}`;

  return `
    <button
      type="button"
      class="p5-audio-pill ${mutedClass} ${blockedClass}"
      id="${containerId}"
      aria-label="${state.isMuted ? 'Nyalakan musik latar Persona' : 'Bisukan musik latar Persona'}"
      title="${state.autoplayBlocked ? 'Klik untuk menyalakan BGM' : state.isMuted ? 'Unmute BGM' : 'Mute BGM'}"
    >
      <span class="p5-audio-eq" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </span>
      <span class="p5-audio-text">${statusLabel}</span>
    </button>
  `;
}

export function bindPersonaAudioBadge(badgeId: string = 'p5AudioBadge'): () => void {
  const update = (state: PersonaAudioState) => {
    const el = document.getElementById(badgeId);
    if (!el) return;
    el.classList.toggle('is-muted', state.isMuted);
    el.classList.toggle('is-blocked', state.autoplayBlocked);
    const textEl = el.querySelector('.p5-audio-text');
    if (textEl) {
      if (state.autoplayBlocked) {
        textEl.textContent = 'KLIK UNTUK PUTAR BGM';
      } else if (state.isMuted) {
        textEl.textContent = 'BGM MUTED';
      } else if (state.meta) {
        textEl.textContent = `${state.meta.subtitle} // ${state.meta.title}`;
      }
    }
  };

  const el = document.getElementById(badgeId);
  if (el && el.dataset.p5AudioBound !== '1') {
    el.dataset.p5AudioBound = '1';
    el.addEventListener('click', () => {
      const current = personaAudio.getState();
      if (current.autoplayBlocked) {
        personaAudio.resumeIfBlocked();
      } else {
        personaAudio.toggleMute();
      }
    });
  }

  return personaAudio.subscribe(update);
}

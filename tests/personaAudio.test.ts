import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  PersonaAudioManager,
  type AudioElementLike,
} from '../src/utils/personaAudio';

function createMockAudio(src: string, shouldRejectPlay = false): AudioElementLike & {
  playCalls: number;
  pauseCalls: number;
} {
  const mock = {
    src,
    loop: false,
    volume: 1,
    currentTime: 0,
    paused: true,
    preload: 'auto',
    playCalls: 0,
    pauseCalls: 0,
    async play() {
      mock.playCalls += 1;
      if (shouldRejectPlay) {
        throw new Error('NotAllowedError');
      }
      mock.paused = false;
    },
    pause() {
      mock.pauseCalls += 1;
      mock.paused = true;
    },
  };
  return mock;
}

describe('PersonaAudioManager & Media Assets', () => {
  it('plays battle theme (Last Surprise) on loop and stops cleanly', async () => {
    const created: ReturnType<typeof createMockAudio>[] = [];
    const manager = new PersonaAudioManager((src) => {
      const a = createMockAudio(src);
      created.push(a);
      return a;
    });

    await manager.play('battle');
    expect(created).toHaveLength(1);
    expect(created[0].src).toContain('audio/last-surprise.mp3');
    expect(created[0].loop).toBe(true);
    expect(created[0].paused).toBe(false);
    expect(manager.getState().currentTrack).toBe('battle');
    expect(manager.getState().isPlaying).toBe(true);

    // Calling play on the same active track is a safe no-op
    await manager.play('battle');
    expect(created).toHaveLength(1);

    // Stopping pauses & rewinds
    created[0].currentTime = 42;
    manager.stop(0);
    expect(created[0].paused).toBe(true);
    expect(created[0].currentTime).toBe(0);
    expect(manager.getState().currentTrack).toBeNull();
    expect(manager.getState().isPlaying).toBe(false);
  });

  it('switches cleanly from battle theme to Cafe Leblanc without overlapping audio', async () => {
    const created: ReturnType<typeof createMockAudio>[] = [];
    const manager = new PersonaAudioManager((src) => {
      const a = createMockAudio(src);
      created.push(a);
      return a;
    });

    await manager.play('battle');
    await manager.play('leblanc');

    expect(created).toHaveLength(2);
    expect(created[0].paused).toBe(true);
    expect(created[1].src).toContain('audio/beneath-the-mask-leblanc.mp3');
    expect(created[1].loop).toBe(true);
    expect(created[1].paused).toBe(false);
    expect(manager.getState().currentTrack).toBe('leblanc');
  });

  it('handles browser autoplay blocking gracefully', async () => {
    const manager = new PersonaAudioManager((src) => createMockAudio(src, true));
    await manager.play('leblanc');

    const state = manager.getState();
    expect(state.currentTrack).toBe('leblanc');
    expect(state.autoplayBlocked).toBe(true);
    expect(state.isPlaying).toBe(false);
  });

  it('toggles mute state and zeroes volume when muted', async () => {
    vi.useFakeTimers();
    const created: ReturnType<typeof createMockAudio>[] = [];
    const manager = new PersonaAudioManager((src) => {
      const a = createMockAudio(src);
      created.push(a);
      return a;
    });

    await manager.play('battle');
    vi.advanceTimersByTime(500);
    expect(created[0].volume).toBeGreaterThan(0.2);

    const muted = manager.toggleMute();
    expect(muted).toBe(true);
    expect(created[0].volume).toBe(0);

    const unmuted = manager.toggleMute();
    expect(unmuted).toBe(false);
    vi.advanceTimersByTime(300);
    expect(created[0].volume).toBeGreaterThan(0.2);

    manager.stop(0);
    vi.useRealTimers();
  });

  it('verifies Joker Mask PNG and both Persona 5 BGM files exist in public/', () => {
    const root = process.cwd();
    const maskPath = path.join(root, 'public/assets/joker-mask.png');
    const battlePath = path.join(root, 'public/audio/last-surprise.mp3');
    const leblancPath = path.join(root, 'public/audio/beneath-the-mask-leblanc.mp3');

    expect(fs.existsSync(maskPath)).toBe(true);
    expect(fs.statSync(maskPath).size).toBeGreaterThan(5_000);

    expect(fs.existsSync(battlePath)).toBe(true);
    expect(fs.statSync(battlePath).size).toBeGreaterThan(500_000);

    expect(fs.existsSync(leblancPath)).toBe(true);
    expect(fs.statSync(leblancPath).size).toBeGreaterThan(500_000);
  });
});

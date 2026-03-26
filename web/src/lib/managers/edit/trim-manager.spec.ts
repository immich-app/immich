import type { EditActions } from '$lib/managers/edit/edit-manager.svelte';
import { AssetEditAction, type AssetResponseDto } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrimManager } from './trim-manager.svelte';

// originalDuration is server-enriched at runtime, not part of the SDK type
function trimEditWithOriginalDuration(startTime: number, endTime: number, originalDuration: number): EditActions {
  return [
    {
      action: AssetEditAction.Trim,
      parameters: { startTime, endTime, originalDuration } as unknown as { startTime: number; endTime: number },
    },
  ];
}

function assetWithDuration(duration: string): AssetResponseDto {
  return { duration } as AssetResponseDto;
}

describe('TrimManager', () => {
  let manager: TrimManager;

  beforeEach(() => {
    manager = new TrimManager();
  });

  describe('onActivate', () => {
    it('should initialize from asset duration', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      expect(manager.duration).toBe(30);
      expect(manager.startTime).toBe(0);
      expect(manager.endTime).toBe(30);
      expect(manager.hasChanges).toBe(false);
    });

    it('should restore existing trim edits', async () => {
      const edits: EditActions = [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } }];
      await manager.onActivate(assetWithDuration('0:00:30.000000'), edits);
      expect(manager.startTime).toBe(5);
      expect(manager.endTime).toBe(25);
      expect(manager.hasChanges).toBe(true);
    });

    it('should use originalDuration for timeline range when re-editing a trimmed video', async () => {
      // After trimming, asset.duration is the trimmed duration (10s),
      // but the edit parameters store originalDuration (30s).
      // The timeline should show the full 30s range so the user can widen the trim.
      await manager.onActivate(assetWithDuration('0:00:10.000000'), trimEditWithOriginalDuration(10, 20, 30));
      expect(manager.duration).toBe(30); // full original range, not 10
      expect(manager.startTime).toBe(10);
      expect(manager.endTime).toBe(20);
      expect(manager.hasChanges).toBe(true);
    });
  });

  describe('handle clamping', () => {
    beforeEach(async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
    });

    it('should clamp start past end to end - 1', () => {
      manager.setEnd(20);
      manager.setStart(25);
      expect(manager.startTime).toBe(19);
    });

    it('should clamp end before start to start + 1', () => {
      manager.setStart(10);
      manager.setEnd(5);
      expect(manager.endTime).toBe(11);
    });

    it('should clamp start to minimum 0', () => {
      manager.setStart(-5);
      expect(manager.startTime).toBe(0);
    });

    it('should clamp end to maximum duration', () => {
      manager.setEnd(50);
      expect(manager.endTime).toBe(30);
    });
  });

  describe('edits', () => {
    it('should return empty when no changes', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      expect(manager.edits).toEqual([]);
    });

    it('should return trim edit when changed', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      manager.setStart(5);
      expect(manager.edits).toHaveLength(1);
      expect(manager.edits[0]).toEqual({
        action: 'trim',
        parameters: { startTime: 5, endTime: 30 },
      });
    });
  });

  describe('resetAllChanges', () => {
    it('should reset to full duration', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      manager.setStart(5);
      manager.setEnd(25);
      await manager.resetAllChanges();
      expect(manager.startTime).toBe(0);
      expect(manager.endTime).toBe(30);
      expect(manager.hasChanges).toBe(false);
    });
  });

  describe('constrained playback', () => {
    it('should pause and seek to start when currentTime reaches endTime', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      manager.setStart(5);
      manager.setEnd(20);

      const mockVideo = {
        currentTime: 20,
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      manager.setVideoElement(mockVideo);

      // Simulate timeupdate firing at endTime
      const addEventListenerMock = vi.mocked(mockVideo.addEventListener);
      const timeupdateCall = addEventListenerMock.mock.calls.find((c) => c[0] === 'timeupdate');
      expect(timeupdateCall).toBeDefined();
      const onTimeUpdate = timeupdateCall![1] as EventListener;
      onTimeUpdate(new Event('timeupdate'));

      expect(mockVideo.pause).toHaveBeenCalled();
      expect(mockVideo.currentTime).toBe(5);
    });
  });

  describe('re-editing trimmed videos', () => {
    it('should allow widening trim beyond current trimmed duration', async () => {
      // Video was 120s, trimmed to 30-90 (60s). asset.duration is now 60s.
      // User re-opens editor — should be able to set start to 10 (before previous start).
      const edits = trimEditWithOriginalDuration(30, 90, 120);
      await manager.onActivate(assetWithDuration('0:01:00.000000'), edits);

      // Can set start earlier than previous trim
      manager.setStart(10);
      expect(manager.startTime).toBe(10);

      // Can set end later than previous trim
      manager.setEnd(100);
      expect(manager.endTime).toBe(100);
    });

    it('should reset to full original duration, not trimmed duration', async () => {
      const edits = trimEditWithOriginalDuration(30, 90, 120);
      await manager.onActivate(assetWithDuration('0:01:00.000000'), edits);

      await manager.resetAllChanges();
      expect(manager.startTime).toBe(0);
      expect(manager.endTime).toBe(120); // original duration, not 60
      expect(manager.hasChanges).toBe(false);
    });

    it('should clamp to original duration, not trimmed duration', async () => {
      const edits = trimEditWithOriginalDuration(10, 20, 30);
      await manager.onActivate(assetWithDuration('0:00:10.000000'), edits);

      // End should clamp to original 30s, not trimmed 10s
      manager.setEnd(50);
      expect(manager.endTime).toBe(30);
    });

    it('should handle missing originalDuration gracefully (first trim)', async () => {
      // First trim — no originalDuration stored yet
      const edits: EditActions = [{ action: AssetEditAction.Trim, parameters: { startTime: 5, endTime: 25 } }];
      await manager.onActivate(assetWithDuration('0:00:30.000000'), edits);

      // Should use asset.duration since there's no originalDuration
      expect(manager.duration).toBe(30);
      expect(manager.startTime).toBe(5);
      expect(manager.endTime).toBe(25);
    });

    it('should not shrink duration if originalDuration is smaller than asset duration', async () => {
      // Edge case: originalDuration is somehow less than current — use the larger value
      const edits = trimEditWithOriginalDuration(5, 15, 10);
      await manager.onActivate(assetWithDuration('0:00:20.000000'), edits);

      // asset.duration (20s) > originalDuration (10s) — keep 20s
      expect(manager.duration).toBe(20);
    });

    it('should produce correct edits after widening a previous trim', async () => {
      const edits = trimEditWithOriginalDuration(30, 90, 120);
      await manager.onActivate(assetWithDuration('0:01:00.000000'), edits);

      // Widen the trim
      manager.setStart(10);
      manager.setEnd(110);

      expect(manager.edits).toHaveLength(1);
      expect(manager.edits[0]).toEqual({
        action: 'trim',
        parameters: { startTime: 10, endTime: 110 },
      });
    });
  });

  describe('derived values', () => {
    it('should compute trimmedDuration correctly', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      manager.setStart(5);
      manager.setEnd(25);
      expect(manager.trimmedDuration).toBe(20);
    });

    it('should compute percentages correctly', async () => {
      await manager.onActivate(assetWithDuration('0:01:40.000000'), []); // 100 seconds
      manager.setStart(25);
      manager.setEnd(75);
      expect(manager.startPercent).toBeCloseTo(0.25);
      expect(manager.endPercent).toBeCloseTo(0.75);
    });

    it('should handle zero duration without division by zero', async () => {
      await manager.onActivate(assetWithDuration(''), []);
      expect(manager.duration).toBe(0);
      expect(manager.startPercent).toBe(0);
      expect(manager.endPercent).toBe(1);
      expect(manager.currentPercent).toBe(0);
    });
  });

  describe('video element lifecycle', () => {
    it('should clean up listeners on deactivate', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);

      const mockVideo = {
        currentTime: 0,
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      manager.setVideoElement(mockVideo);
      expect(mockVideo.addEventListener).toHaveBeenCalledTimes(3); // timeupdate, play, pause

      manager.onDeactivate();

      expect(mockVideo.removeEventListener).toHaveBeenCalledTimes(3);
    });

    it('should handle setVideoElement(undefined) without error', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);
      expect(() => manager.setVideoElement(undefined)).not.toThrow();
    });

    it('should replace video element cleanly', async () => {
      await manager.onActivate(assetWithDuration('0:00:30.000000'), []);

      const video1 = {
        currentTime: 0,
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      const video2 = {
        currentTime: 0,
        pause: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLVideoElement;

      manager.setVideoElement(video1);
      manager.setVideoElement(video2); // should cleanup video1

      expect(video1.removeEventListener).toHaveBeenCalledTimes(3);
      expect(video2.addEventListener).toHaveBeenCalledTimes(3);
    });
  });

  describe('duration parsing', () => {
    it('should handle null duration', async () => {
      await manager.onActivate({ duration: null } as unknown as AssetResponseDto, []);
      expect(manager.duration).toBe(0);
    });

    it('should handle undefined duration', async () => {
      await manager.onActivate({} as unknown as AssetResponseDto, []);
      expect(manager.duration).toBe(0);
    });

    it('should parse hours correctly', async () => {
      await manager.onActivate(assetWithDuration('1:30:45.500000'), []);
      expect(manager.duration).toBe(3600 + 1800 + 45 + 0.5);
    });

    it('should parse duration without fractional seconds', async () => {
      await manager.onActivate(assetWithDuration('0:01:00'), []);
      expect(manager.duration).toBe(60);
    });
  });
});

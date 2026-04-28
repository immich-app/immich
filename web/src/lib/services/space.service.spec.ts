import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import * as handleErrorModule from '$lib/utils/handle-error';
import { addAssets } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addAssetsToSpace } from './space.service';

vi.mock('$app/navigation', () => ({ goto: vi.fn().mockResolvedValue(undefined) }));

vi.mock('@immich/ui', async (orig) => {
  const actual = await orig<typeof import('@immich/ui')>();
  return {
    ...actual,
    toastManager: { primary: vi.fn(), danger: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
  };
});

vi.mock('@immich/sdk', async (orig) => ({
  ...(await orig<typeof import('@immich/sdk')>()),
  addAssets: vi.fn().mockResolvedValue(undefined),
}));

let handleErrorSpy: ReturnType<typeof vi.spyOn>;
let emitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(addAssets).mockResolvedValue(undefined as never);
  handleErrorSpy = vi.spyOn(handleErrorModule, 'handleError').mockImplementation(() => {});
  emitSpy = vi.spyOn(eventManager, 'emit');
});

afterEach(() => {
  handleErrorSpy.mockRestore();
  emitSpy.mockRestore();
});

describe('addAssetsToSpace', () => {
  it('adds assets to the target space, emits refresh event, and shows a toast when requested', async () => {
    await expect(addAssetsToSpace('space-1', ['asset-1', 'asset-2'], { notify: true })).resolves.toBe(true);

    expect(addAssets).toHaveBeenCalledWith({
      id: 'space-1',
      sharedSpaceAssetAddDto: { assetIds: ['asset-1', 'asset-2'] },
    });
    expect(emitSpy).toHaveBeenCalledWith('SpaceAddAssets', { assetIds: ['asset-1', 'asset-2'], spaceId: 'space-1' });
    expect(toastManager.primary).toHaveBeenCalledOnce();
  });

  it('does not show a toast when notify is false', async () => {
    await expect(addAssetsToSpace('space-1', ['asset-1'], { notify: false })).resolves.toBe(true);

    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith('SpaceAddAssets', { assetIds: ['asset-1'], spaceId: 'space-1' });
  });

  it('routes the success toast action to the target space', async () => {
    await addAssetsToSpace('space-1', ['asset-1'], { notify: true });

    const [toast] = vi.mocked(toastManager.primary).mock.calls[0];
    const button = (toast as { button?: { onclick?: () => void } }).button;
    button?.onclick?.();

    expect(goto).toHaveBeenCalledWith('/spaces/space-1');
  });

  it('handles failures and does not emit refresh events', async () => {
    const error = new Error('no permission');
    vi.mocked(addAssets).mockRejectedValueOnce(error);

    await expect(addAssetsToSpace('space-1', ['asset-1'], { notify: true })).resolves.toBe(false);

    expect(handleErrorSpy).toHaveBeenCalledWith(error, expect.any(String));
    expect(emitSpy).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
  });
});

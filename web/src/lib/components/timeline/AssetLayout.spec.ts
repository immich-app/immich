import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';
import AssetLayoutTest from './AssetLayoutTest.svelte';

class TestScrollManager extends VirtualScrollManager {}

type PendingAnimation = {
  currentTime: number;
  duration: number;
  playState: string;
  effect: object | null;
  onfinish: (() => void) | null;
  cancel: () => void;
};

const viewerAsset = (id: string) => {
  const value = new ViewerAsset(timelineAssetFactory.build({ id }));
  value.position = { top: 0, left: 0, width: 100, height: 100 };
  return value;
};

describe('AssetLayout', () => {
  let animations: PendingAnimation[];

  beforeEach(() => {
    animations = [];
    vi.spyOn(Element.prototype, 'animate').mockImplementation((_frames, options) => {
      const animation: PendingAnimation = {
        currentTime: 0,
        duration: Number(typeof options === 'object' ? options.duration : options),
        playState: 'running',
        effect: {},
        onfinish: null,
        cancel() {
          animation.playState = 'idle';
        },
      };
      animations.push(animation);
      return animation as unknown as Animation;
    });
  });

  afterEach(() => vi.restoreAllMocks());

  const finishAnimations = async () => {
    while (animations.length > 0) {
      for (const animation of animations.splice(0)) {
        if (animation.playState !== 'running') {
          continue;
        }
        animation.currentTime = animation.duration;
        animation.playState = 'finished';
        animation.onfinish?.();
      }
      await tick();
    }
  };

  it('removes old thumbnails after reopening the panel during its outro', async () => {
    const manager = new TestScrollManager();
    const first = viewerAsset('first');
    const { container, rerender } = render(AssetLayoutTest, { show: true, viewerAssets: [first], manager });

    await rerender({ show: false });
    manager.suspendTransitions = true;
    await rerender({ show: true, viewerAssets: [first, viewerAsset('second')] });
    await rerender({ viewerAssets: [viewerAsset('current')] });
    await finishAnimations();

    expect([...container.querySelectorAll<HTMLElement>('[data-asset-id]')].map((node) => node.dataset.assetId)).toEqual(
      ['current'],
    );
    expect(container.querySelector('[inert]')).toBeNull();
  });

  it('finishes the outro when deleting one thumbnail', async () => {
    const first = viewerAsset('first');
    const second = viewerAsset('second');
    const { container, rerender } = render(AssetLayoutTest, {
      show: true,
      viewerAssets: [first, second],
      manager: new TestScrollManager(),
    });

    await rerender({ viewerAssets: [second] });
    expect(container.querySelector('[data-asset-id="first"]')).not.toBeNull();
    await finishAnimations();
    expect(container.querySelector('[data-asset-id="first"]')).toBeNull();
    expect(container.querySelector('[data-asset-id="second"]')).not.toBeNull();
  });

  it('removes thumbnails immediately when their day is removed', async () => {
    const { container, rerender } = render(AssetLayoutTest, {
      show: true,
      viewerAssets: [viewerAsset('first')],
      manager: new TestScrollManager(),
    });

    await rerender({ showDay: false });
    expect(container.querySelector('[data-asset-id="first"]')).toBeNull();
  });
});

import { getAnimateMock } from '#lib/__mocks__/animate.mock.ts';
import { sdkMock } from '#lib/__mocks__/sdk.mock.ts';
import AssetLayout from '#lib/components/timeline/AssetLayout.svelte';
import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
import { fromISODateTimeUTCToObject } from '#lib/utils/timeline-util.ts';
import { factory } from '#test/unit/factories.ts';
import { render } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';

const newAsset = (takenAt: string) => {
  const dateTime = fromISODateTimeUTCToObject(takenAt);
  return factory.timelineAsset({ ratio: 1, fileCreatedAt: dateTime, localDateTime: dateTime });
};

describe('AssetLayout component', () => {
  let timelineManager: TimelineManager;

  beforeEach(async () => {
    Element.prototype.animate = getAnimateMock();
    sdkMock.getTimeBuckets.mockResolvedValue([]);
    timelineManager = new TimelineManager();
    await timelineManager.updateViewport({ width: 1588, height: 1000 });
  });

  afterEach(() => {
    timelineManager.destroy();
  });

  it('moves the remaining thumbnails into place when an asset is removed', () => {
    const removed = newAsset('2024-01-20T12:00:00.000Z');
    const remaining = newAsset('2024-01-20T11:00:00.000Z');
    timelineManager.upsertAssets([removed, remaining]);
    const timelineDay = timelineManager.months[0].timelineDays[0];
    const { container } = render(AssetLayout, {
      viewerAssets: timelineDay.viewerAssets,
      width: timelineDay.width,
      height: timelineDay.height,
      manager: timelineManager,
      thumbnail: createRawSnippet(() => ({ render: () => '<span></span>' })),
    });

    timelineManager.removeAssets([removed.id]);
    flushSync();

    const thumbnail = container.querySelector<HTMLElement>(`[data-asset-id="${CSS.escape(remaining.id)}"]`);
    expect(thumbnail?.style.getPropertyValue('inset-inline-start')).toBe('0px');
  });
});

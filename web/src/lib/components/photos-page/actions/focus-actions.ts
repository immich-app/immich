import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { moveFocus } from '$lib/utils/focus-util';
import { InvocationTracker } from '$lib/utils/invocationTracker';
import { tick } from 'svelte';

const tracker = new InvocationTracker();

const getFocusedThumb = () => {
  const current = document.activeElement as HTMLElement | undefined;
  if (current && current.dataset.thumbnailFocusContainer !== undefined) {
    return current;
  }
};

export const focusNextAsset = () =>
  moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'next');

export const focusPreviousAsset = () =>
  moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'previous');

const queryHTMLElement = (query: string) => document.querySelector(query) as HTMLElement;

export const setFocusToAsset = (scrollToAsset: (asset: TimelineAsset) => boolean, asset: TimelineAsset) => {
  const scrolled = scrollToAsset(asset);
  if (scrolled) {
    const element = queryHTMLElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
    element?.focus();
  }
};

export const setFocusTo = async (
  scrollToAsset: (asset: TimelineAsset) => boolean,
  store: TimelineManager,
  direction: 'earlier' | 'later',
  interval: 'day' | 'month' | 'year' | 'asset',
) => {
  if (tracker.isActive()) {
    // there are unfinished running invocations, so return early
    return;
  }
  const thumb = getFocusedThumb();
  if (!thumb) {
    return direction === 'earlier' ? focusNextAsset() : focusPreviousAsset();
  }

  const invocation = tracker.startInvocation();
  const id = thumb.dataset.asset;
  if (!thumb || !id) {
    invocation.endInvocation();
    return;
  }

  const asset =
    direction === 'earlier'
      ? await store.getEarlierAsset({ id }, interval)
      : await store.getLaterAsset({ id }, interval);

  if (!invocation.isStillValid()) {
    return;
  }

  if (!asset) {
    invocation.endInvocation();
    return;
  }

  const scrolled = scrollToAsset(asset);
  if (scrolled) {
    await tick();
    if (!invocation.isStillValid()) {
      return;
    }
    const element = queryHTMLElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
    element?.focus();
  }

  invocation.endInvocation();
};

import type { AssetStore, TimelineAsset } from '$lib/stores/assets-store.svelte';
import { moveFocus } from '$lib/utils/focus-util';
import { InvocationTracker } from '$lib/utils/invocationTracker';

const tracker = new InvocationTracker();

const getFocusedThumb = () => {
  const current = document.activeElement as HTMLElement;
  if (current && current.dataset.thumbnailFocusContainer !== undefined) {
    return current;
  }
};

export const focusNextAsset = () =>
  moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'next');

export const focusPreviousAsset = () =>
  moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'previous');

const queryHTMLElement = (query: string) => document.querySelector(query) as HTMLElement;

export const setFocusToAsset = async (scrollToAsset: (asset: TimelineAsset) => boolean, asset: TimelineAsset) => {
  const scrolled = scrollToAsset(asset);
  if (scrolled) {
    const element = queryHTMLElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
    element?.focus();
  }
};

export const setFocusTo = async (
  scrollToAsset: (asset: TimelineAsset) => boolean,
  store: AssetStore,
  direction: 'earlier' | 'later',
  magnitude: 'day' | 'month' | 'year' | 'asset',
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
      ? await store.getEarlierAsset({ id }, magnitude)
      : await store.getLaterAsset({ id }, magnitude);

  if (!invocation.isStillValid()) {
    return;
  }

  if (!asset) {
    invocation.endInvocation();
    return;
  }

  const scrolled = scrollToAsset(asset);
  if (scrolled) {
    const element = queryHTMLElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
    element?.focus();
  }

  invocation.endInvocation();
};

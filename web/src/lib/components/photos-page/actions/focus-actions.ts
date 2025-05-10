import type { AssetStore } from '$lib/stores/assets-store.svelte';
import { moveFocus } from '$lib/utils/focus-util';
import { InvocationTracker } from '$lib/utils/invocationTracker';
import { retry } from '$lib/utils/retry';

const waitForElement = retry((query: string) => document.querySelector(query) as HTMLElement, 10, 100);
const tracker = new InvocationTracker();
const getFocusedThumb = () => {
  const current = document.activeElement as HTMLElement;
  if (current && current.dataset.thumbnailFocusContainer !== undefined) {
    return current;
  }
};

export const focusNextAsset = () => moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, true);
export const focusPreviousAsset = () =>
  moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, false);

export const setFocusToAsset = async (scrollToAsset: (id: string) => Promise<boolean>, asset: { id: string }) => {
  const scrolled = await scrollToAsset(asset.id);
  if (scrolled) {
    const element = await waitForElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
    element?.focus();
  }
};

export const setFocusTo = async (
  scrollToAsset: (id: string) => Promise<boolean>,
  store: AssetStore,
  direction: 'next' | 'previous',
  skip: 'day' | 'month' | 'year',
) => {
  const thumb = getFocusedThumb();
  if (!thumb) {
    if (tracker.isActive()) {
      // there are unfinished running invocations, so return early
      return;
    }
    return direction === 'next' ? focusNextAsset() : focusPreviousAsset();
  }

  const invocation = tracker.startInvocation();
  const id = thumb.dataset.asset;
  if (!thumb || !id) {
    invocation.endInvocation();
    return;
  }
  try {
    const asset =
      direction === 'next' ? await store.getNextAsset({ id }, skip) : await store.getPreviousAsset({ id }, skip);
    invocation.checkStillValid();

    if (!asset) {
      invocation.endInvocation();
      return;
    }

    const scrolled = await scrollToAsset(asset.id);
    invocation.checkStillValid();

    if (scrolled) {
      const element = await waitForElement(`[data-thumbnail-focus-container][data-asset="${asset.id}"]`);
      invocation.checkStillValid();
      element?.focus();
    }

    invocation.endInvocation();
  } catch (error: unknown) {
    if (invocation.isInvalidInvocationError(error)) {
      // expected
      return;
    }
    throw error;
  }
};

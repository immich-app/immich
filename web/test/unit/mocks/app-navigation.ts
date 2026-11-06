import { MockRouter } from '#test/unit/mocks/router.ts';
import { onMount } from 'svelte';
import type { AfterNavigate } from '$app/navigation';

const noop = () => {};
const resolved = () => Promise.resolve();

export const goto = (url: string | URL) => MockRouter.instance.goto(url);

export const afterNavigate = (callback: (navigation: AfterNavigate) => void) => {
  onMount(() => {
    callback({ type: 'enter', from: null, to: null, shallow: false, willUnload: false, complete: Promise.resolve() });
  });
};

export const beforeNavigate = noop;
export const onNavigate = noop;
export const disableScrollHandling = noop;
export const invalidate = resolved;
export const invalidateAll = resolved;
export const refreshAll = resolved;
export const preloadData = resolved;
export const preloadCode = resolved;
export const pushState = (url: string | URL) => MockRouter.instance.goto(url);
export const replaceState = (url: string | URL) => MockRouter.instance.goto(url);

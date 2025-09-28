import type { PhotostreamSegment } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';

let testHooks: { hookSegment: (segment: PhotostreamSegment) => void } | undefined = undefined;

export function setTestHook(hooks: { hookSegment: (segment: PhotostreamSegment) => void }) {
  testHooks = hooks;
}

export function getTestHook() {
  return testHooks;
}

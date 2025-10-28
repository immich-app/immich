import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';

export type TestHooks = {
  onCreateTimelineMonth(month: TimelineMonth): unknown;
  onCreateTimelineDay(day: TimelineDay): unknown;
};

let testHooks: TestHooks | undefined = undefined;

export const setTestHooks = (hooks: TestHooks) => {
  testHooks = hooks;
};

export const onCreateTimelineMonth = (month: TimelineMonth) => testHooks?.onCreateTimelineMonth(month);
export const onCreateTimelineDay = (day: TimelineDay) => testHooks?.onCreateTimelineDay(day);

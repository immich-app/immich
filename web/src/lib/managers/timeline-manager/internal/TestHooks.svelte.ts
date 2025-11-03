import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';

let testHooks: TestHooks | undefined = undefined;

export type TestHooks = {
  onCreateMonth(month: TimelineMonth): unknown;
  onCreateDay(day: TimelineDay): unknown;
};

export const setTestHooks = (hooks: TestHooks) => {
  testHooks = hooks;
};

export const onCreateMonth = (month: TimelineMonth) => testHooks?.onCreateMonth(month);
export const onCreateDay = (day: TimelineDay) => testHooks?.onCreateDay(day);

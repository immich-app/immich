import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';

let testHooks: TestHooks | undefined = undefined;

export type TestHooks = {
  onCreateMonthGroup(monthGroup: MonthGroup): unknown;
  onCreateDayGroup(dayGroup: DayGroup): unknown;
};

export const setTestHooks = (hooks: TestHooks) => {
  testHooks = hooks;
};

export const onCreateMonthGroup = (monthGroup: MonthGroup) => testHooks?.onCreateMonthGroup(monthGroup);
export const onCreateDayGroup = (dayGroup: DayGroup) => testHooks?.onCreateDayGroup(dayGroup);

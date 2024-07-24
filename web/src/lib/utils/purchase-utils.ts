import { preferences } from '$lib/stores/user.store';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';

export const getButtonVisibility = (): number => {
  const myPreferences = get(preferences);

  if (!myPreferences) {
    return 0;
  }

  const { purchase } = myPreferences;
  const hideUntil = purchase.hideUntil;

  if (!hideUntil) {
    return 0;
  }

  const now = DateTime.now();
  const hideUntilDate = DateTime.fromISO(hideUntil);
  const dayLeft = now.diff(hideUntilDate, 'days').days.toFixed(0);

  console.log('dayLeft', dayLeft);
  return Number(dayLeft);
};

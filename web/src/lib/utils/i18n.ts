import { locale, t, waitLocale } from 'svelte-i18n';
import { get, type Unsubscriber } from 'svelte/store';

export async function getFormatter() {
  let unsubscribe: Unsubscriber | undefined;
  await new Promise((resolve) => {
    unsubscribe = locale.subscribe((value) => value && resolve(value));
  });
  unsubscribe?.();

  await waitLocale();
  return get(t);
}

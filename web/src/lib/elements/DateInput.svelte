<script lang="ts">
  import { locale } from '#lib/stores/preferences.store.ts';
  import { get } from 'svelte/store';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    type: 'date' | 'datetime-local';
    value?: string;
    min?: string;
    max?: string;
    class?: string;
    id?: string;
    name?: string;
    placeholder?: string;
    autofocus?: boolean;
    onkeydown?: (e: KeyboardEvent) => void;
  }

  let { type, value = $bindable(), max = undefined, onkeydown, ...rest }: Props = $props();

  let fallbackMax = $derived(type === 'date' ? '9999-12-31' : '9999-12-31T23:59');

  // Updating `value` directly causes the date input to reset itself or
  // interfere with user changes.
  let updatedValue = $derived(value);

  // The native date/datetime input renders its time portion using the browser
  // locale (12h vs 24h). Force the user's configured Immich locale so it
  // matches the rest of the app. See https://github.com/immich-app/immich/issues/29752
  const userLocale = $derived(get(locale) === 'default' ? undefined : get(locale));
  const resolvedOptions = $derived(
    new Intl.DateTimeFormat(userLocale, { hour: 'numeric' }).resolvedOptions(),
  );
  const use24Hour = $derived(resolvedOptions.hourCycle === 'h23' || resolvedOptions.hourCycle === 'h24');
</script>

<input
  {...rest}
  {type}
  bind:value
  max={max || fallbackMax}
  lang={userLocale}
  oninput={(e) => (updatedValue = e.currentTarget.value)}
  onblur={() => (value = updatedValue)}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      value = updatedValue;
    }
    onkeydown?.(e);
  }}
  step=".001"
  data-locale-hour-cycle={use24Hour ? 'h23' : 'h12'}
/>

<style>
  /* Chrome/Safari pick 12h vs 24h from the input's lang attribute plus the
     browser locale; when the configured locale prefers 24h, hint it. */
  input[data-locale-hour-cycle='h23'] {
    --hour-cycle: h23;
  }
</style>
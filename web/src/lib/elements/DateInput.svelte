<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { mdiCalendar } from '@mdi/js';
  import { DateTime } from 'luxon';
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

  let { type, value = $bindable(), min, max, onkeydown, ...rest }: Props = $props();

  let hiddenInput: HTMLInputElement;

  const fallbackMax = $derived(type === 'date' ? '9999-12-31' : '9999-12-31T23:59');

  function formatValue(val: string | undefined, activeLocale: string) {
    if (!val) {
      return '';
    }

    const date = new Date(val);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat(activeLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: type === 'datetime-local' ? '2-digit' : undefined,
      minute: type === 'datetime-local' ? '2-digit' : undefined,
      second: type === 'datetime-local' ? '2-digit' : undefined,
      hour12: true,
    });

    let formatted = formatter.format(date);

    if (type === 'datetime-local') {
      const ms = date.getMilliseconds().toString().padStart(3, '0');
      formatted += `.${ms}`;
    }

    return formatted;
  }

  let editableValue = $derived(formatValue(value, $locale));

  function parseInput(input: string): string | null {
    if (!input) {
      return null;
    }

    const primaryPattern = buildLuxonPattern($locale);

    // Common fallback patterns to try
    const fallbackPatterns =
      type === 'date'
        ? ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'dd.MM.yyyy', 'M/d/yyyy', 'd/M/yyyy', 'yyyy/MM/dd', 'dd-MM-yyyy']
        : [
            'yyyy-MM-dd, hh:mm:ss a.SSS',
            'MM/dd/yyyy, hh:mm:ss a.SSS',
            'dd/MM/yyyy, hh:mm:ss a.SSS',
            'dd.MM.yyyy, hh:mm:ss a.SSS',
            'yyyy-MM-dd hh:mm:ss a.SSS',
            'MM/dd/yyyy hh:mm:ss a',
            'dd/MM/yyyy hh:mm:ss a',
          ];

    const patterns = [primaryPattern, ...fallbackPatterns];

    let parsed: DateTime | null = null;

    for (const pattern of patterns) {
      const attempt = DateTime.fromFormat(input, pattern, {
        locale: $locale,
      });
      if (attempt.isValid) {
        parsed = attempt;
        break;
      }
    }

    if (!parsed || !parsed.isValid) {
      console.error('Could not parse date input:', input);
      return null;
    }

    if (type === 'date') {
      return parsed.toISODate();
    }

    const iso = parsed.toISO();
    return iso ? iso.slice(0, 23) : null;
  }

  function handleVisibleBlur() {
    const parsed = parseInput(editableValue);

    if (parsed) {
      value = parsed;
    } else {
      // revert to last valid value
      editableValue = formatValue(value, $locale);
    }
  }

  function buildLuxonPattern(activeLocale: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: type === 'datetime-local' ? '2-digit' : undefined,
      minute: type === 'datetime-local' ? '2-digit' : undefined,
      second: type === 'datetime-local' ? '2-digit' : undefined,
      hour12: true,
    };

    const formatter = new Intl.DateTimeFormat(activeLocale, options);

    // Use fixed reference date so structure is consistent
    const reference = new Date(2000, 11, 31, 23, 59, 58, 123);

    const parts = formatter.formatToParts(reference);

    const tokenMap: Record<string, string> = {
      year: 'yyyy',
      month: 'MM',
      day: 'dd',
      hour: 'hh',
      minute: 'mm',
      second: 'ss',
      dayPeriod: 'a',
    };

    let pattern = parts
      .map((p) => {
        if (p.type in tokenMap) {
          return tokenMap[p.type];
        }
        return p.value; // keep separators like ".", "/", ", ", etc.
      })
      .join('');

    if (type === 'datetime-local') {
      pattern += '.SSS';
    }

    return pattern;
  }

  function handleHiddenInput(e: Event) {
    value = (e.currentTarget as HTMLInputElement).value;
  }

  function openPicker() {
    hiddenInput?.showPicker?.();
    hiddenInput?.focus();
  }
</script>

<div class="relative w-full">
  <!-- Visible editable input -->
  <input {...rest} type="text" bind:value={editableValue} onblur={handleVisibleBlur} {onkeydown} />

  <!-- Calendar icon button -->
  <button
    type="button"
    onclick={openPicker}
    aria-label="Open date picker"
    class="absolute top-1/2 right-3.5 -translate-y-1/2 hover:text-immich-primary dark:hover:text-immich-dark-primary rounded transition-colors"
  >
    <svg class="w-5 h-5" viewBox="0 0 24 24">
      <path fill="currentColor" d={mdiCalendar} />
    </svg>
  </button>

  <!-- Hidden native input -->
  <input
    bind:this={hiddenInput}
    {type}
    bind:value
    {min}
    max={max || fallbackMax}
    step=".001"
    class="absolute inset-0 opacity-0 pointer-events-none"
    oninput={handleHiddenInput}
  />
</div>

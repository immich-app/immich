<script lang="ts">
  import { Button, DatePicker, Field } from '@immich/ui';
  import { locale } from '$lib/stores/preferences.store';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    expiresAt: string | null;
  };

  let { expiresAt = $bindable() }: Props = $props();

  const expirationOptions: [number, Intl.RelativeTimeFormatUnit][] = [
    [1, 'day'],
    [7, 'days'],
    [30, 'days'],
    [3, 'months'],
    [1, 'year'],
  ];

  const relativeTime = $derived(new Intl.RelativeTimeFormat($locale));
  const expiredDateOptions = $derived([
    { text: $t('never'), value: 0 },
    ...expirationOptions.map(([value, unit]) => ({
      text: relativeTime.format(value, unit),
      value: Duration.fromObject({ [unit]: value }).toMillis(),
    })),
  ]);

  let selectedDate = $state<DateTime | undefined>(expiresAt ? DateTime.fromISO(expiresAt) : undefined);

  const selectPreset = (value: number) => {
    if (value === 0) {
      selectedDate = undefined;
      return;
    }
    selectedDate = DateTime.now().plus(value);
  };

  const isSelected = (value: number) => {
    if (value === 0) {
      return !selectedDate;
    }
    if (!selectedDate) {
      return false;
    }
    const target = DateTime.now().plus(value);
    // Tolerance of 1 minute roughly, or exact match?
    // Using a small tolerance like 10 seconds to be safe with execution time
    return Math.abs(selectedDate.diff(target).toMillis()) < 60_000;
  };

  $effect(() => {
    if (selectedDate) {
      // Only update if changed significantly to avoid infinite loops with ISO string conversion
      const current = expiresAt ? DateTime.fromISO(expiresAt) : null;
      if (!current || Math.abs(selectedDate.diff(current).toMillis()) > 100) {
        expiresAt = selectedDate.toISO();
      }
    } else if (expiresAt !== null) {
      expiresAt = null;
    }
  });

  $effect(() => {
    if (expiresAt) {
      const dt = DateTime.fromISO(expiresAt);
      if (!selectedDate || Math.abs(dt.diff(selectedDate).toMillis()) > 100) {
        selectedDate = dt;
      }
    } else if (selectedDate !== undefined) {
      selectedDate = undefined;
    }
  });
</script>

<div class="mt-2">
  <Field label={$t('expire_after')}>
    <DatePicker bind:value={selectedDate} />
  </Field>

  <div class="flex flex-wrap gap-2 mt-2">
    {#each expiredDateOptions as option}
      <Button
        size="tiny"
        variant={isSelected(option.value) ? 'filled' : 'outline'}
        onclick={() => selectPreset(option.value)}
      >
        {option.text}
      </Button>
    {/each}
  </div>
</div>

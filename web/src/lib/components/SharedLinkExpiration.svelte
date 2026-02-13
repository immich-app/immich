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

  let selectedPresetValue = $state<number | null>(null);

  const getSelectedDate = (): DateTime | undefined => {
    return expiresAt ? DateTime.fromISO(expiresAt) : undefined;
  };

  const setSelectedDate = (value: DateTime | undefined) => {
    selectedPresetValue = null; // Clear preset when manually setting date
    expiresAt = value ? value.toISO() : null;
  };

  const selectPreset = (value: number) => {
    selectedPresetValue = value;
    if (value === 0) {
      expiresAt = null;
      return;
    }
    const newDate = DateTime.now().plus(value);
    expiresAt = newDate.toISO();
  };

  const isSelected = (value: number) => {
    return selectedPresetValue === value;
  };
</script>

<div class="mt-2">
  <Field label={$t('expire_after')}>
    <DatePicker bind:value={getSelectedDate, setSelectedDate} />
  </Field>

  <div class="flex flex-wrap gap-2 mt-2">
    {#each expiredDateOptions as option (option.value)}
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

<script lang="ts">
  import SettingSelect from '$lib/components/shared-components/settings/setting-select.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { minBy, uniqBy } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    createdAt?: string;
    expiresAt: string | null;
  };

  let { createdAt = DateTime.now().toISO(), expiresAt = $bindable() }: Props = $props();

  const expirationOptions: [number, Intl.RelativeTimeFormatUnit][] = [
    [30, 'minutes'],
    [1, 'hour'],
    [6, 'hours'],
    [1, 'day'],
    [7, 'days'],
    [30, 'days'],
    [3, 'months'],
    [1, 'year'],
  ];

  const relativeTime = $derived(new Intl.RelativeTimeFormat($locale));
  const expiredDateOptions = $derived([
    { text: $t('never'), value: 0 },
    ...expirationOptions
      .map(([value, unit]) => ({
        text: relativeTime.format(value, unit),
        value: Duration.fromObject({ [unit]: value }).toMillis(),
      }))
      .filter(({ value: millis }) => DateTime.fromISO(createdAt).plus(millis) > DateTime.now()),
  ]);

  const getExpirationOption = (createdAt: string, expiresAt: string | null) => {
    if (!expiresAt) {
      return expiredDateOptions[0];
    }

    const delta = DateTime.fromISO(expiresAt).diff(DateTime.fromISO(createdAt)).toMillis();
    const closestOption = minBy(expiredDateOptions, ({ value }) => Math.abs(delta - value));

    if (!closestOption) {
      return expiredDateOptions[0];
    }

    // allow a generous epsilon to compensate for potential API delays
    if (Math.abs(closestOption.value - delta) > 10_000) {
      const interval = DateTime.fromMillis(closestOption.value) as DateTime<true>;
      return { text: interval.toRelative({ locale: $locale }), value: closestOption.value };
    }

    return closestOption;
  };

  const onSelect = (option: number | string) => {
    const expirationOption = Number(option);

    expiresAt = expirationOption === 0 ? null : DateTime.fromISO(createdAt).plus(expirationOption).toISO();
  };

  let expirationOption = $derived(getExpirationOption(createdAt, expiresAt).value);
</script>

<div class="mt-2">
  <SettingSelect
    bind:value={expirationOption}
    {onSelect}
    options={uniqBy([...expiredDateOptions, getExpirationOption(createdAt, expiresAt)], 'value')}
    label={$t('expire_after')}
    number={true}
  />
</div>

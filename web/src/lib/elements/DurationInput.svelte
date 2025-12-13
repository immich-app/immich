<script lang="ts">
  import { t } from 'svelte-i18n';
  import { Duration } from 'luxon';

  interface Props {
    value: number;
    class?: string;
    id?: string;
  }

  let { value = $bindable(), class: className = '', ...rest }: Props = $props();

  function minToParts(minutes: number) {
    const duration = Duration.fromObject({ minutes: Math.abs(minutes) }).shiftTo('days', 'hours', 'minutes');
    return {
      sign: minutes < 0 ? -1 : 1,
      days: duration.days === 0 ? null : duration.days,
      hours: duration.hours === 0 ? null : duration.hours,
      minutes: duration.minutes === 0 ? null : duration.minutes,
    };
  }

  function partsToMin(sign: number, days: number | null, hours: number | null, minutes: number | null) {
    return (
      sign *
      Duration.fromObject({ days: days ?? 0, hours: hours ?? 0, minutes: minutes ?? 0 }).shiftTo('minutes').minutes
    );
  }

  const initial = minToParts(value);
  let sign = $state(initial.sign);
  let days = $state(initial.days);
  let hours = $state(initial.hours);
  let minutes = $state(initial.minutes);

  $effect(() => {
    value = partsToMin(sign, days, hours, minutes);
  });

  function toggleSign() {
    sign = -sign;
  }
</script>

<div class={`flex gap-2 ${className}`} {...rest}>
  <button type="button" class="w-8 text-xl font-bold leading-none" onclick={toggleSign} title="Toggle sign">
    {sign >= 0 ? '+' : '-'}
  </button>
  <input type="number" min="0" placeholder={$t('days')} class="w-1/3" bind:value={days} />
  <input type="number" min="0" max="23" placeholder={$t('hours')} class="w-1/3" bind:value={hours} />
  <input type="number" min="0" max="59" placeholder={$t('minutes')} class="w-1/3" bind:value={minutes} />
</div>

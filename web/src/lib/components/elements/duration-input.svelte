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

  function partsToMin(s: number, d: number | null, h: number | null, m: number | null) {
    return s * Duration.fromObject({ days: d ?? 0, hours: h ?? 0, minutes: m ?? 0 }).shiftTo('minutes').minutes;
  }

  const initial = minToParts(value);
  let sign = $state(initial.sign);
  let days = $state(initial.days);
  let hours = $state(initial.hours);
  let minutes = $state(initial.minutes);

  function update() {
    value = partsToMin(sign, days, hours, minutes);
  }

  function toggleSign() {
    sign = -sign;
    update();
  }
</script>

<div class={`flex gap-2 ${className}`} {...rest}>
  <button type="button" class="w-8 text-xl font-bold" onclick={toggleSign} title="Toggle sign">
    {sign >= 0 ? '+' : '-'}
  </button>
  <input
    type="number"
    min="0"
    placeholder={$t('days')}
    class="immich-form-input w-1/3"
    bind:value={days}
    oninput={update}
  />
  <input
    type="number"
    min="0"
    max="23"
    placeholder={$t('hours')}
    class="immich-form-input w-1/3"
    bind:value={hours}
    oninput={update}
  />
  <input
    type="number"
    min="0"
    max="59"
    placeholder={$t('minutes')}
    class="immich-form-input w-1/3"
    bind:value={minutes}
    oninput={update}
  />
</div>

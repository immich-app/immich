<script lang="ts">
  interface Props {
    value: number;
    class?: string;
    id?: string;
  }

  let { value = $bindable(), class: className = '', ...rest }: Props = $props();

  function minToParts(min: number) {
    const sign = min < 0 ? -1 : 1;
    const abs = Math.abs(min);
    const days = Math.floor(abs / (60 * 24));
    const remaining = abs - days * 60 * 24;
    const hours = Math.floor(remaining / 60);
    const minutes = remaining - hours * 60;
    return {
      sign,
      days: days === 0 ? null : days,
      hours: hours === 0 ? null : hours,
      minutes: minutes === 0 ? null : minutes,
    };
  }

  function partsToMin(s: number, d: number | null, h: number | null, m: number | null) {
    return s * (d ?? 0) * 24 * 60 + (h ?? 0) * 60 + (m ?? 0);
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
  <button
    type="button"
    class="px-2 text-lg font-bold rounded border border-gray-300 dark:border-gray-600"
    onclick={toggleSign}
    title="Toggle sign"
  >
    {sign >= 0 ? '+' : '-'}
  </button>
  <input type="number" min="0" placeholder="Days" class="immich-form-input w-1/3" bind:value={days} oninput={update} />
  <input
    type="number"
    min="0"
    max="23"
    placeholder="Hours"
    class="immich-form-input w-1/3"
    bind:value={hours}
    oninput={update}
  />
  <input
    type="number"
    min="0"
    max="59"
    placeholder="Minutes"
    class="immich-form-input w-1/3"
    bind:value={minutes}
    oninput={update}
  />
</div>

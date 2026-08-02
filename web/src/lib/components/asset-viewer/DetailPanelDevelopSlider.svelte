<script lang="ts">
  interface Props {
    id: string;
    label: string;
    minimum: number;
    maximum: number;
    step: number;
    value: number;
    disabled?: boolean;
  }

  let { id, label, minimum, maximum, step, value = $bindable(), disabled = false }: Props = $props();

  const setValue = (rawValue: string) => {
    const numericValue = rawValue === '' ? 0 : Number(rawValue);
    value = Number.isFinite(numericValue) ? Math.min(maximum, Math.max(minimum, numericValue)) : 0;
  };
</script>

<div class="grid min-h-9 grid-cols-[4.5rem_minmax(0,1fr)_3.75rem] items-center gap-2">
  <label for={id} class="text-xs text-immich-fg/75 dark:text-immich-dark-fg/75">{label}</label>
  <input
    {id}
    type="range"
    min={minimum}
    max={maximum}
    {step}
    value={value}
    oninput={(event) => setValue(event.currentTarget.value)}
    {disabled}
    class="min-w-0 accent-primary"
  />
  <input
    aria-label={`${label} value`}
    type="number"
    min={minimum}
    max={maximum}
    {step}
    value={value}
    onchange={(event) => setValue(event.currentTarget.value)}
    {disabled}
    class="h-7 w-15 rounded-md border border-black/10 bg-gray-100 px-1.5 text-right text-xs tabular-nums outline-hidden focus:border-primary dark:border-white/10 dark:bg-gray-800"
  />
</div>

<script lang="ts">
  interface Props {
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (value: number) => void;
  }

  let { label, value, min, max, onChange }: Props = $props();

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChange(Number(target.value));
  };
</script>

<div class="setting-slider">
  <label>{label}</label>
  <input type="range" bind:value={value} min={min} max={max} on:change={handleChange} />
  <span>{value}</span>
</div>

<style>
  .setting-slider {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-slider label {
    font-weight: bold;
  }

  .setting-slider input[type='range'] {
    flex-grow: 1;
  }

  .setting-slider span {
    width: 2rem;
    text-align: center;
  }
</style>

<script lang="ts">
  interface Props {
    label: string;
    value: string;
    onChange: (value: string) => void;
  }

  let { label, value, onChange }: Props = $props();

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChange(target.value);
  };
</script>

<div class="setting-color-picker">
  <label>{label}</label>
  <input type="color" bind:value={value} on:change={handleChange} />
</div>

<style>
  .setting-color-picker {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-color-picker label {
    font-weight: bold;
  }

  .setting-color-picker input[type='color'] {
    border: none;
    padding: 0;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
  }
</style>

<script lang="ts">
  interface Props {
    type: 'date' | 'datetime-local';
    value?: string;
    min?: string;
    max?: string;
    class?: string;
    id?: string;
    name?: string;
    placeholder?: string;
  }

  let { type, value = $bindable(), max = undefined, ...rest }: Props = $props();

  let fallbackMax = $derived(type === 'date' ? '9999-12-31' : '9999-12-31T23:59');

  // Updating `value` directly causes the date input to reset itself or
  // interfere with user changes.
  let updatedValue = $state<string>();
  $effect(() => {
    updatedValue = value;
  });
</script>

<input
  {...rest}
  {type}
  {value}
  max={max || fallbackMax}
  oninput={(e) => (updatedValue = e.currentTarget.value)}
  onblur={() => (value = updatedValue)}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      value = updatedValue;
    }
  }}
/>

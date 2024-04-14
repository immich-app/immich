<script lang="ts">
  import Button, { type Color } from './button.svelte';

  export let color: Color = 'transparent-primary';
  export let title: string | undefined = undefined;
</script>

<Button size="icon" {color} {title} shadow={false} rounded="full" on:click>
  <slot />
</Button>

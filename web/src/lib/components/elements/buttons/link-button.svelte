<script lang="ts" context="module">
  export type Color = 'transparent-primary' | 'transparent-gray';
</script>

<script lang="ts">
  import Button from './button.svelte';

  export let color: Color = 'transparent-gray';
</script>

<Button size="link" {color} shadow={false} rounded="lg" on:click>
  <slot />
</Button>

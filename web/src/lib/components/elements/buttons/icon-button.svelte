<script lang="ts" context="module">
	export type Color = 'transparent-primary' | 'transparent-gray' | 'overlay-primary';
</script>

<script lang="ts">
	import Button from './button.svelte';

	export let color: Color = 'transparent-primary';
	export let title: string | undefined = undefined;
</script>

<Button size="icon" {color} {title} shadow={false} rounded="full" on:click>
	<slot />
</Button>

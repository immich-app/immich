<script lang="ts">
	import Button from '$lib/components/elements/buttons/button.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let showResetToDefault = true;
</script>

<div class="flex justify-between gap-2  mt-8">
	<div class="left">
		{#if showResetToDefault}
			<button
				on:click={() => dispatch('reset-to-default')}
				class="text-sm dark:text-immich-dark-primary hover:dark:text-immich-dark-primary/75 text-immich-primary hover:text-immich-primary/75 font-medium bg-none"
			>
				Reset to default
			</button>
		{/if}
	</div>

	<div class="right">
		<Button size="sm" color="gray" on:click={() => dispatch('reset')}>Reset</Button>
		<Button size="sm" on:click={() => dispatch('save')}>Save</Button>
	</div>
</div>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let showResetToDefault = true;
</script>

<div class="flex justify-between gap-2 mx-4 mt-8">
	<div class="left">
		{#if showResetToDefault}
			<button
				on:click|preventDefault={() => dispatch('reset-to-default')}
				class="text-sm dark:text-immich-dark-primary hover:dark:text-immich-dark-primary/75 text-immich-primary hover:text-immich-primary/75 font-medium bg-none"
			>
				Reset to default
			</button>
		{/if}
	</div>

	<div class="right">
		<button
			on:click|preventDefault={() => dispatch('reset')}
			class="text-sm bg-gray-500 dark:bg-gray-200 hover:bg-gray-500/75 dark:hover:bg-gray-200/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
			>Reset
		</button>

		<button
			type="submit"
			on:click={() => dispatch('save')}
			class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
			>Save
		</button>
	</div>
</div>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div class="flex justify-end gap-2 mr-4 mt-8">
	<button
		on:click|preventDefault={() => dispatch('reset')}
		class="text-sm bg-gray-500 dark:bg-gray-200 hover:bg-gray-500/75 dark:hover:bg-gray-200/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium"
		>Reset
	</button>

	<button
		type="submit"
		on:click={() => dispatch('save')}
		class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium"
		>Save
	</button>
</div>

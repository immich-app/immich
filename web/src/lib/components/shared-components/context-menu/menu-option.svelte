<script>
	import { createEventDispatcher } from 'svelte';

	export let isDisabled = false;
	export let text = '';

	const dispatch = createEventDispatcher();

	const handleClick = () => {
		if (isDisabled) return;

		dispatch('click');
	};
</script>

<button
	class:disabled={isDisabled}
	on:click={handleClick}
	class="bg-white hover:bg-gray-300 dark:text-immich-dark-bg transition-all p-4 w-full text-left rounded-lg text-sm"
>
	{#if text}
		{text}
	{:else}
		<slot />
	{/if}
</button>

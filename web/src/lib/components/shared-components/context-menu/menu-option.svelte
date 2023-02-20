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
	class="bg-slate-100 hover:bg-gray-200 dark:text-immich-dark-bg transition-all p-4 w-full text-left text-sm font-medium"
>
	{#if text}
		{text}
	{:else}
		<slot />
	{/if}
</button>

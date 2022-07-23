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
	class="bg-white hover:bg-immich-bg transition-all p-4 w-full text-left rounded-lg"
>
	{#if text}
		{text}
	{:else}
		<slot />
	{/if}
</button>

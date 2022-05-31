<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let logo: any;

	const dispatch = createEventDispatcher();
</script>

<button
	class="rounded-full p-3 flex place-items-center place-content-center text-gray-50 hover:bg-gray-900"
	on:click={() => dispatch('click')}
>
	<svelte:component this={logo} size="24" />
</button>

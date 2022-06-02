<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let logo: any;
	export let backgroundColor: string = '';
	export let logoColor: string = '';

	const dispatch = createEventDispatcher();
</script>

<button
	class="rounded-full p-3 flex place-items-center place-content-center text-gray-50 hover:bg-gray-800"
	class:background-color={backgroundColor}
	class:color={logoColor}
	on:click={() => dispatch('click')}
>
	<svelte:component this={logo} size="24" />
</button>

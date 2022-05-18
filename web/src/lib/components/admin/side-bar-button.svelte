<script lang="ts">
	export let title: string;
	export let logo: any;

	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const onButtonClicked = () => {
		dispatch('selected', {
			actionType: title.toUpperCase(),
		});
	};
</script>

<div
	on:click={onButtonClicked}
	class="flex gap-4 place-items-center pl-5 py-3 rounded-tr-xl rounded-br-xl hover:bg-gray-200 hover:text-immich-primary hover:cursor-pointer"
>
	<svelte:component this={logo} size="24" />
	<p class="font-medium text-sm">{title}</p>
</div>

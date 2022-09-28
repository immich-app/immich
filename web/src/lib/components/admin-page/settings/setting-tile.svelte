<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title: string;
	export let subtitle: string;

	const dispatch = createEventDispatcher();
</script>

<div class="flex border p-6 rounded-lg bg-white">
	<div class="w-[70%]">
		<h1 class="font-medium text-immich-primary">{title}</h1>
		<p class="text-sm mt-1">{subtitle}il</p>
	</div>
	<div class="w-[30%] flex place-items-center place-content-end">
		<button
			on:click={() => dispatch('click')}
			class="border px-4 py-2 text-sm bg-gray-50 font-medium rounded-lg hover:bg-immich-primary/10 transition-all"
			>Generate</button
		>
	</div>
</div>

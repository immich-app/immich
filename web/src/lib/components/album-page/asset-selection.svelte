<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { fly } from 'svelte/transition';
	const dispatch = createEventDispatcher();
</script>

<section
	transition:fly={{ y: 1000, duration: 200, easing: quintOut }}
	class="absolute top-0 left-0 w-full h-full bg-immich-bg z-[1000]"
>
	<div class="fixed top-0 w-full bg-immich-bg z-[100] ">
		<div class={`flex rounded-lg p-2 mx-2 mt-2 gap-6 transition-all place-items-center`}>
			<button
				on:click={() => dispatch('go-back')}
				id="immich-circle-icon-button"
				class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
			>
				<Close size="24" />
			</button>
			<p class="text-lg">Add to album</p>
		</div>
	</div>

	<p class="text-4xl">Select Photos</p>
</section>

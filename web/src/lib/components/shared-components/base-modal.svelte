<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Close from 'svelte-material-icons/Close.svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
</script>

<div
	id="immich-modal"
	transition:fly={{ y: 1000, duration: 200, easing: quintOut }}
	class="absolute top-0 w-screen h-screen z-[9999] bg-black/50 flex place-items-center place-content-center"
>
	<div class="bg-white w-[450px] min-h-[200px] max-h-[500px] rounded-lg shadow-md">
		<div class="flex justify-between place-items-center p-5">
			<div>
				<slot name="title">
					<p>Modal Title</p>
				</slot>
			</div>
			<button on:click={() => dispatch('close')}>
				<Close size="24" />
			</button>
		</div>

		<div class="mt-4">
			<slot />
		</div>
	</div>
</div>

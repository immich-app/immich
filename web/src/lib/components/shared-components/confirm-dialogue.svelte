<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import FullScreenModal from './full-screen-modal.svelte';

	export let title = 'Confirm';
	export let prompt = 'Are you sure you want to do this?';
	export let confirmText = 'Confirm';
	export let cancelText = 'Cancel';

	const dispatch = createEventDispatcher();
	const handleCancel = () => dispatch('cancel');
	const handleConfirm = () => dispatch('confirm');
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
	<div
		class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
	>
		<div
			class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
		>
			<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium pb-2">
				{title}
			</h1>
		</div>
		<div>
			<slot name="prompt">
				<p class="ml-4 text-md py-5 text-center">{prompt}</p>
			</slot>

			<div class="flex w-full px-4 gap-4 mt-4">
				<button
					on:click={() => handleCancel()}
					class="flex-1 transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
				>
					{cancelText}
				</button>
				<button
					on:click={() => handleConfirm()}
					class="flex-1 transition-colors bg-red-500 hover:bg-red-400 px-6 py-3 text-white rounded-full w-full font-medium"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
</FullScreenModal>

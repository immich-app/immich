<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import FullScreenModal from './full-screen-modal.svelte';
	import Button from '../elements/buttons/button.svelte';
	import type { Color } from '$lib/components/elements/buttons/button.svelte';

	export let title = 'Confirm';
	export let prompt = 'Are you sure you want to do this?';
	export let confirmText = 'Confirm';
	export let confirmColor: Color = 'red';
	export let cancelText = 'Cancel';
	export let cancelColor: Color = 'primary';
	export let hideCancelButton = false;

	const dispatch = createEventDispatcher();

	let isConfirmButtonDisabled = false;

	const handleCancel = () => dispatch('cancel');

	const handleConfirm = () => {
		isConfirmButtonDisabled = true;
		dispatch('confirm');
	};
</script>

<FullScreenModal on:clickOutside={handleCancel}>
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
			<div class="px-4 py-5 text-md text-center">
				<slot name="prompt">
					<p>{prompt}</p>
				</slot>
			</div>

			<div class="flex w-full px-4 gap-4 mt-4">
				{#if !hideCancelButton}
					<Button color={cancelColor} fullwidth on:click={handleCancel}>
						{cancelText}
					</Button>
				{/if}
				<Button
					color={confirmColor}
					fullwidth
					on:click={handleConfirm}
					disabled={isConfirmButtonDisabled}
				>
					{confirmText}
				</Button>
			</div>
		</div>
	</div>
</FullScreenModal>

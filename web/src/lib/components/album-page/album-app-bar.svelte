<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import Close from 'svelte-material-icons/Close.svelte';

	export let backIcon = Close;
	let appBarBorder = '';
	const dispatch = createEventDispatcher();
	onMount(() => {
		window.onscroll = () => {
			if (window.pageYOffset > 80) {
				appBarBorder = 'border border-gray-200 bg-gray-50';
			} else {
				appBarBorder = '';
			}
		};
	});
</script>

<div class="fixed top-0 w-full bg-transparent z-[100]">
	<div
		id="asset-selection-app-bar"
		class={`flex justify-between ${appBarBorder} rounded-lg p-2 mx-2 mt-2  transition-all place-items-center`}
	>
		<div class="flex place-items-center gap-6">
			<button
				on:click={() => dispatch('close-button-click')}
				id="immich-circle-icon-button"
				class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
			>
				<svelte:component this={backIcon} size="24" />
			</button>
			<slot name="leading" />
		</div>

		<div class="flex place-items-center gap-6 mr-4">
			<slot name="trailing" />
		</div>
	</div>
</div>

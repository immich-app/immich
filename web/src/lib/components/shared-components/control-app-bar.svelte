<script lang="ts">
	import { browser } from '$app/environment';

	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import { fly } from 'svelte/transition';

	export let showBackButton = true;
	export let backIcon = Close;
	export let tailwindClasses = '';
	export let forceDark = false;

	let appBarBorder = 'bg-immich-bg border border-transparent';

	const dispatch = createEventDispatcher();

	const onScroll = () => {
		if (window.pageYOffset > 80) {
			appBarBorder = 'border border-gray-200 bg-gray-50 dark:border-gray-600';

			if (forceDark) {
				appBarBorder = 'border border-gray-600';
			}
		} else {
			appBarBorder = 'bg-immich-bg border border-transparent';
		}
	};

	onMount(() => {
		if (browser) {
			document.addEventListener('scroll', onScroll);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('scroll', onScroll);
		}
	});
</script>

<div in:fly={{ y: 10, duration: 200 }} class="fixed top-0 w-full bg-transparent z-[100]">
	<div
		id="asset-selection-app-bar"
		class={`grid grid-cols-3 justify-between ${appBarBorder} rounded-lg p-2 mx-2 mt-2 transition-all place-items-center ${tailwindClasses} dark:bg-immich-dark-gray ${
			forceDark && 'bg-immich-dark-gray text-white'
		}`}
	>
		<div class="flex place-items-center gap-6 dark:text-immich-dark-fg justify-self-start">
			{#if showBackButton}
				<CircleIconButton
					on:click={() => dispatch('close-button-click')}
					logo={backIcon}
					backgroundColor={'transparent'}
					hoverColor={'#e2e7e9'}
					size={'24'}
					forceDark
				/>
			{/if}
			<slot name="leading" />
		</div>

		<div class="w-full">
			<slot />
		</div>

		<div class="flex place-items-center gap-1 mr-4 justify-self-end">
			<slot name="trailing" />
		</div>
	</div>
</div>

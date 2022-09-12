<script lang="ts">
	import { browser } from '$app/env';

	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import { fly } from 'svelte/transition';
	export let backIcon = Close;
	export let tailwindClasses = '';

	let appBarBorder = 'bg-immich-bg border border-transparent';

	const dispatch = createEventDispatcher();

	const onScroll = () => {
		if (window.pageYOffset > 80) {
			appBarBorder = 'border border-gray-200 bg-gray-50';
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

<div
	transition:fly|local={{ y: 10, duration: 200 }}
	class="fixed top-0 w-full bg-transparent z-[100]"
>
	<div
		id="asset-selection-app-bar"
		class={`flex justify-between ${appBarBorder} rounded-lg p-2 mx-2 mt-2 transition-all place-items-center ${tailwindClasses}`}
	>
		<div class="flex place-items-center gap-6">
			<CircleIconButton
				on:click={() => dispatch('close-button-click')}
				logo={backIcon}
				backgroundColor={'transparent'}
				logoColor={'rgb(75 85 99)'}
				hoverColor={'#e2e7e9'}
				size={'24'}
			/>

			<slot name="leading" />
		</div>

		<div class="flex place-items-center gap-1 mr-4">
			<slot name="trailing" />
		</div>
	</div>
</div>

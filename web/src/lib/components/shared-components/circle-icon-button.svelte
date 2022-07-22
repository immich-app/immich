<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let logo: any;
	export let backgroundColor: string = '#d3d3d3';
	export let hoverColor: string = '#d0d0d0';
	export let logoColor: string;
	export let size = '24';
	let iconButton: HTMLButtonElement;
	const dispatch = createEventDispatcher();

	$: {
		if (iconButton) {
			iconButton.style.backgroundColor = backgroundColor;
			iconButton.style.setProperty('--immich-icon-button-hover-color', hoverColor);
		}
	}
</script>

<button
	bind:this={iconButton}
	class={`immich-circle-icon-button rounded-full p-3 flex place-items-center place-content-center transition-all`}
	on:click={() => dispatch('click')}
>
	<svelte:component this={logo} {size} color={logoColor} />
</button>

<style>
	:root {
		--immich-icon-button-hover-color: #d3d3d3;
	}

	.immich-circle-icon-button:hover {
		background-color: var(--immich-icon-button-hover-color) !important;
	}
</style>

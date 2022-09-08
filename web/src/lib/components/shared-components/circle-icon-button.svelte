<script lang="ts">
	/**
	 * This is the circle icon component.
	 */
	import { createEventDispatcher } from 'svelte';

	// TODO: why any here?
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	export let logo: any;
	export let backgroundColor = 'transparent';
	export let hoverColor = '#e2e7e9';
	export let logoColor = '#5f6368';
	export let size = '24';
	export let title = '';
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
	{title}
	bind:this={iconButton}
	class={`immich-circle-icon-button rounded-full p-3 flex place-items-center place-content-center transition-all`}
	on:click={(mouseEvent) => dispatch('click', { mouseEvent })}
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

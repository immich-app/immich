<script lang="ts">
	import type Icon from 'svelte-material-icons/AbTesting.svelte';

	export let logo: typeof Icon;
	export let backgroundColor = 'transparent';
	export let hoverColor = '#e2e7e9';
	export let size = '24';
	export let title = '';
	export let isOpacity = false;
	export let forceDark = false;
</script>

<button
	{title}
	style:background-color={backgroundColor}
	style:--immich-icon-button-hover-color={hoverColor}
	class:dark:text-immich-dark-fg={!forceDark}
	class="rounded-full p-3 flex place-items-center place-content-center transition-all
	{isOpacity ? 'hover:bg-immich-bg/30' : 'immich-circle-icon-button hover:dark:text-immich-dark-gray'}
  {forceDark && 'hover:text-black'}"
	on:click
>
	<svelte:component this={logo} {size} />
	<slot />
</button>

<style>
	:root {
		--immich-icon-button-hover-color: #d3d3d3;
	}

	.immich-circle-icon-button:hover {
		background-color: var(--immich-icon-button-hover-color) !important;
	}
</style>

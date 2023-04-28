<script lang="ts">
	import type Icon from 'svelte-material-icons/AbTesting.svelte';

	export let logo: typeof Icon;
	export let backgroundColor = 'transparent';
	export let hoverColor = '#e2e7e9';
	export let size = '24';
	export let title = '';
</script>

<button
	{title}
	style:backgroundColor
	style:--immich-icon-button-hover-color={hoverColor}
	class="immich-circle-icon-button dark:text-immich-dark-fg hover:dark:text-immich-dark-gray rounded-full p-3 flex place-items-center place-content-center transition-all"
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

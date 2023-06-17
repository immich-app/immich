<script lang="ts">
	import { onMount } from 'svelte';
	import { lazyLoad } from 'unlazy';
	import { imageLoad } from '$lib/utils/image-load';

	export let url: string;
	export let altText: string;
	export let heightStyle: string | undefined = undefined;
	export let widthStyle: string;
	export let thumbhash: string | null = null;
	export let curve = false;
	export let shadow = false;
	export let circle = false;
	let loading = true;

	let imageElement: HTMLImageElement;

	onMount(() => {
		if (thumbhash) {
			lazyLoad(imageElement, {
				hash: thumbhash,
				hashType: 'thumbhash'
			});
		}
	});
</script>

{#if thumbhash}
	<img
		style:width={widthStyle}
		style:height={heightStyle}
		data-src={url}
		alt={altText}
		class="object-cover"
		class:rounded-lg={curve}
		class:shadow-lg={shadow}
		class:rounded-full={circle}
		draggable="false"
		bind:this={imageElement}
	/>

	<!-- not everthing yet has thumbhash support so the old method is kept -->
{:else}
	<img
		style:width={widthStyle}
		style:height={heightStyle}
		src={url}
		alt={altText}
		class="object-cover transition-opacity duration-300"
		class:rounded-lg={curve}
		class:shadow-lg={shadow}
		class:rounded-full={circle}
		class:opacity-0={loading}
		draggable="false"
		use:imageLoad
		on:image-load|once={() => (loading = false)}
	/>
{/if}

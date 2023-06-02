<script lang="ts">
	import { onMount } from 'svelte';
	import { lazyLoad } from 'unlazy';
  
	export let url: string;
	export let altText: string;
	export let heightStyle: string | undefined = undefined;
	export let widthStyle: string;
	export let thumbhash: string;
	export let curve = false;
	export let shadow = false;
	export let circle = false;
  
	let imageElement: HTMLImageElement;
  
	onMount(() => {
	  lazyLoad(imageElement, {
		hash: thumbhash,
		hashType: 'thumbhash',
	  });
	});
  </script>
  
  <img
	load="lazy"
	style:width={widthStyle}
	style:height={heightStyle}
	data-src={url}
	alt={altText}
	class="object-cover transition-opacity duration-300"
	class:rounded-lg={curve}
	class:shadow-lg={shadow}
	class:rounded-full={circle}
	draggable="false"
	data-thumbhash={thumbhash}
	bind:this={imageElement}
  />
  
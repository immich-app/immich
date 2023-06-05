<script lang="ts">
	import { onMount } from 'svelte';
	import { lazyLoad } from 'unlazy';
	import * as Buffer from 'buffer';

	export let url: string;
	export let altText: string;
	export let heightStyle: string | undefined = undefined;
	export let widthStyle: string;
	export let thumbhash: Buffer;
	export let curve = false;
	export let shadow = false;
	export let circle = false;
  
	let imageElement: HTMLImageElement;
  
	onMount(() => {
		const Str = Buffer.Buffer.from(thumbhash).toString('base64');
		console.log(Str);
		lazyLoad(imageElement, {
			hash: Str,
			hashType: 'thumbhash',
		});
	});
  </script>
  
  <img
	style:width={widthStyle}
	style:height={heightStyle}
	data-src={url}
	alt={altText}
	class="object-cover transition-opacity duration-300"
	class:rounded-lg={curve}
	class:shadow-lg={shadow}
	class:rounded-full={circle}
	draggable="false"
	bind:this={imageElement}
  />
  
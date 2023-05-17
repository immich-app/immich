<script lang="ts">
	import { imageLoad } from '$lib/utils/image-load';

	export let url: string;
	export let altText: string;
	export let heightStyle: string | undefined = undefined;
	export let widthStyle: string;
	export let curve = false;
	export let shadow = false;
	export let circle = false;
	let loading = true;
</script>

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

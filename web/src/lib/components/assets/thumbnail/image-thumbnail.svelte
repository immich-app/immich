<script lang="ts">
	export let url: string;
	export let altText: string;
	export let heightStyle: string;
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
	class="object-cover transition-opacity duration-300 {curve ? 'rounded-lg' : ''} {shadow
		? 'shadow-lg'
		: ''} {circle ? 'rounded-full' : ''}"
	class:opacity-0={loading}
	draggable="false"
	on:load|once={() => (loading = false)}
/>

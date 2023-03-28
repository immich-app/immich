<script lang="ts">
	export let url: string;
	export let altText: string;
	export let heightStyle: string;
	export let widthStyle: string;

	let loading = true;
</script>

<img
	style:width={widthStyle}
	style:height={heightStyle}
	src={url}
	alt={altText}
	class="object-cover transition-opacity duration-300"
	class:opacity-0={loading}
	draggable="false"
	on:load|once={() => (loading = false)}
/>

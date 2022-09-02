<script lang="ts">
	import IntersectionObserver from '../asset-viewer/intersection-observer.svelte';

	let viewportHeight = 0;
	let viewportWidth = 0;
	let assetGridElement: HTMLElement;
	let dummy = Array.from({ length: 1000 }, (_, i) => i);

	function intersectedHandler(event: CustomEvent) {
		const el = event.detail as HTMLElement;
		const target = el.firstChild as HTMLElement;

		console.log('intersected', target.id);
	}
</script>

<section
	id="asset-grid"
	class="bg-blue-200/50 border-2 border-green-700 overflow-y-auto"
	bind:clientHeight={viewportHeight}
	bind:clientWidth={viewportWidth}
	bind:this={assetGridElement}
>
	<p>Viewport height: {viewportHeight} px</p>
	<p>Viewport width: {viewportWidth} px</p>

	{#if assetGridElement}
		<IntersectionObserver
			on:intersected={intersectedHandler}
			bottom={300}
			top={300}
			root={assetGridElement}
		>
			<div>Test</div>
		</IntersectionObserver>
	{/if}
</section>

<style>
	#asset-grid {
		contain: layout;
	}
</style>

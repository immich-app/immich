<script lang="ts">
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { getFileUrl } from '@api';

	export let assetId: string;
	export let publicSharedKey = '';

	let isVideoLoading = true;
	const dispatch = createEventDispatcher();

	const handleCanPlay = (ev: Event & { currentTarget: HTMLVideoElement }) => {
		const playerNode = ev.currentTarget;

		playerNode.muted = true;
		playerNode.play();
		playerNode.muted = false;

		isVideoLoading = false;
	};
</script>

<div
	transition:fade={{ duration: 150 }}
	class="flex place-items-center place-content-center h-full select-none"
>
	<video
		controls
		class="h-full object-contain"
		src={getFileUrl(assetId, false, true, publicSharedKey)}
		on:canplay={handleCanPlay}
		on:ended={() => dispatch('onVideoEnded')}
	>
		<track kind="captions" />
	</video>

	{#if isVideoLoading}
		<div class="absolute flex place-items-center place-content-center">
			<LoadingSpinner />
		</div>
	{/if}
</div>

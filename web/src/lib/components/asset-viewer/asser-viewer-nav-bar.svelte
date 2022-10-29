<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	const dispatch = createEventDispatcher();

	export let showCopyButton: boolean;
</script>

<div
	class="h-16 bg-black/5 flex justify-between place-items-center px-3 transition-transform duration-200 z-[9999]"
>
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2">
		{#if showCopyButton}
			<CircleIconButton
				logo={ContentCopy}
				on:click={() => {
					dispatch('copy');
				}}
			/>
		{/if}
		<CircleIconButton logo={CloudDownloadOutline} on:click={() => dispatch('download')} />
		<CircleIconButton logo={InformationOutline} on:click={() => dispatch('showDetail')} />
	</div>
</div>

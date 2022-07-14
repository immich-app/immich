<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import CloudDownloadOutline from 'svelte-material-icons/CloudDownloadOutline.svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import CircleIconButton from '../shared/circle-icon-button.svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="h-16 bg-black/5 flex justify-between place-items-center px-3 transition-transform duration-200 z-[9999]">
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={() => dispatch('goBack')} />
	</div>
	<div class="text-white flex gap-2">
		<CircleIconButton logo={CloudDownloadOutline} on:click={() => dispatch('download')} />
		<!-- <CircleIconButton logo={DotsVertical} on:click={() => console.log('Options')} /> -->
		<CircleIconButton logo={InformationOutline} on:click={() => dispatch('showDetail')} />
	</div>
</div>

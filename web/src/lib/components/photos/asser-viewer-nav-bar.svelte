<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
	import InformationOutline from 'svelte-material-icons/InformationOutline.svelte';
	import type { ImmichAsset, ImmichExif } from '../../models/immich-asset';
	import CircleIconButton from '../shared/circle_icon_button.svelte';

	export let asset: ImmichAsset;

	const dispatch = createEventDispatcher();

	const backButtonHandler = () => dispatch('goBack');

	const handleShowExtraInformation = () => {
		dispatch('showDetail');
	};
</script>

<div class="h-16 bg-black/5 flex justify-between place-items-center px-6 transition-transform duration-200 z-[9999]">
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={backButtonHandler} />
	</div>
	<div class="text-white flex gap-2">
		<CircleIconButton logo={InformationOutline} on:click={handleShowExtraInformation} />
		<CircleIconButton logo={TrashCanOutline} on:click={() => console.log('Options')} />
		<CircleIconButton logo={DotsVertical} on:click={() => console.log('Options')} />
	</div>
</div>

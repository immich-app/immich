<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import type { ImmichAsset } from '../../models/immich-asset';
	import CircleIconButton from '../shared/circle_icon_button.svelte';

	export let asset: ImmichAsset;

	const dispatch = createEventDispatcher();

	const backButtonHandler = () => dispatch('goBack');
</script>

<div class="absolute w-screen h-16 bg-black/5 top-0 left-0 z-[9999] flex justify-between place-items-center px-6">
	<div>
		<CircleIconButton logo={ArrowLeft} on:click={backButtonHandler} />
	</div>
	<div class="text-white">Button</div>
</div>

<script lang="ts">
	import type { UploadAsset } from '$lib/models/upload-asset';
	import { locale } from '$lib/stores/preferences.store';
	import { asByteUnitString } from '$lib/utils/byte-units';
	import { fade } from 'svelte/transition';
	import ImmichLogo from './immich-logo.svelte';

	export let uploadAsset: UploadAsset;

	let showFallbackImage = false;
	const previewURL = URL.createObjectURL(uploadAsset.file);
</script>

<div
	in:fade={{ duration: 250 }}
	out:fade={{ duration: 100 }}
	class="text-xs mt-3 rounded-lg bg-immich-bg grid grid-cols-[70px_auto] gap-2 h-[70px]"
>
	<div class="relative">
		{#if showFallbackImage}
			<div in:fade={{ duration: 250 }}>
				<ImmichLogo class="h-[70px] w-[70px] object-cover rounded-tl-lg rounded-bl-lg" />
			</div>
		{:else}
			<img
				in:fade={{ duration: 250 }}
				on:load={() => {
					URL.revokeObjectURL(previewURL);
				}}
				on:error={() => {
					URL.revokeObjectURL(previewURL);
					showFallbackImage = true;
				}}
				src={previewURL}
				alt="Preview of asset"
				class="h-[70px] w-[70px] object-cover rounded-tl-lg rounded-bl-lg"
				draggable="false"
			/>
		{/if}

		<div class="bottom-0 left-0 absolute w-full h-[25px] bg-immich-primary/30">
			<p
				class="absolute bottom-1 right-1 object-right-bottom text-gray-50/95 font-semibold stroke-immich-primary uppercase"
			>
				.{uploadAsset.fileExtension}
			</p>
		</div>
	</div>

	<div class="p-2 pr-4 flex flex-col justify-between">
		<input
			disabled
			class="bg-gray-100 border w-full p-1 rounded-md text-[10px] px-2"
			value={`[${asByteUnitString(uploadAsset.file.size, $locale)}] ${uploadAsset.file.name}`}
		/>

		<div class="w-full bg-gray-300 h-[15px] rounded-md mt-[5px] text-white relative">
			<div
				class="bg-immich-primary h-[15px] rounded-md transition-all"
				style={`width: ${uploadAsset.progress}%`}
			/>
			<p class="absolute h-full w-full text-center top-0 text-[10px]">
				{uploadAsset.progress}/100
			</p>
		</div>
	</div>
</div>

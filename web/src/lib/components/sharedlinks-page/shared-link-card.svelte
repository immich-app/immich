<script lang="ts">
	import { api, AssetResponseDto, SharedLinkResponseDto, SharedLinkType } from '@api';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';

	export let link: SharedLinkResponseDto;

	const getAssetInfo = async (): Promise<AssetResponseDto> => {
		let assetId = '';

		if (link.album?.albumThumbnailAssetId) {
			assetId = link.album.albumThumbnailAssetId;
		} else if (link.assets.length > 0) {
			assetId = link.assets[0];
		}

		const { data } = await api.assetApi.getAssetById(assetId);

		return data;
	};
</script>

<div class="dark:bg-gray-700 w-full rounded-xl">
	{#await getAssetInfo()}
		<LoadingSpinner />
	{:then asset}
		<img
			id={asset.id}
			src={`/api/asset/thumbnail/${asset.id}?format=WEBP`}
			alt={asset.id}
			class={`object-cover w-[100px] h-[100px] rounded-tl-xl rounded-bl-xl`}
			loading="lazy"
		/>
	{/await}
</div>

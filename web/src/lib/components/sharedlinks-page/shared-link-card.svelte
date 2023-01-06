<script lang="ts">
	import { api, AssetResponseDto, SharedLinkResponseDto, SharedLinkType } from '@api';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import * as luxon from 'luxon';

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

<div class="dark:bg-gray-800 bg-gray-100 w-full rounded-lg flex gap-4 dark:text-immich-gray">
	<div class="p-[3px]">
		{#await getAssetInfo()}
			<LoadingSpinner />
		{:then asset}
			<img
				id={asset.id}
				src={`/api/asset/thumbnail/${asset.id}?format=WEBP`}
				alt={asset.id}
				class={`object-cover w-[120px] h-[120px] rounded-tl-lg rounded-bl-lg`}
				loading="lazy"
			/>
		{/await}
	</div>

	<div class="mt-2 flex-col flex justify-between place-content-center pb-2">
		<div class="text-sm">
			<div class=" text-immich-primary dark:text-immich-dark-primary">
				{#if link.type === SharedLinkType.Album}
					<p>
						{link.album?.albumName.toUpperCase()}
					</p>
				{:else if link.type === SharedLinkType.Individual}
					<p>INDIVIDUAL SHARE</p>
				{/if}
			</div>

			<p class="text-sm">{link.description ?? ''}</p>
		</div>

		<p class="text-sm">
			{link.expiresAt
				? `Expired on ${luxon.DateTime.fromISO(new Date(link.expiresAt).toISOString()).toFormat(
						"dd LLL yyyy 'at' HH:mm"
				  )}`
				: 'Never expire'}
		</p>
	</div>
</div>

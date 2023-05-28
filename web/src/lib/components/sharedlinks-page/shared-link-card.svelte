<script lang="ts">
	import {
		api,
		AssetResponseDto,
		SharedLinkResponseDto,
		SharedLinkType,
		ThumbnailFormat
	} from '@api';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
	import Delete from 'svelte-material-icons/TrashCanOutline.svelte';
	import ContentCopy from 'svelte-material-icons/ContentCopy.svelte';
	import CircleEditOutline from 'svelte-material-icons/CircleEditOutline.svelte';
	import * as luxon from 'luxon';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	export let link: SharedLinkResponseDto;

	let expirationCountdown: luxon.DurationObjectUnits;
	const dispatch = createEventDispatcher();

	const getAssetInfo = async (): Promise<AssetResponseDto> => {
		let assetId = '';

		if (link.album?.albumThumbnailAssetId) {
			assetId = link.album.albumThumbnailAssetId;
		} else if (link.assets.length > 0) {
			assetId = link.assets[0].id;
		}

		const { data } = await api.assetApi.getAssetById({ assetId });

		return data;
	};

	const getCountDownExpirationDate = () => {
		if (!link.expiresAt) {
			return;
		}

		const expiresAtDate = luxon.DateTime.fromISO(new Date(link.expiresAt).toISOString());
		const now = luxon.DateTime.now();

		expirationCountdown = expiresAtDate
			.diff(now, ['days', 'hours', 'minutes', 'seconds'])
			.toObject();

		if (expirationCountdown.days && expirationCountdown.days > 0) {
			return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'days' });
		} else if (expirationCountdown.hours && expirationCountdown.hours > 0) {
			return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'hours' });
		} else if (expirationCountdown.minutes && expirationCountdown.minutes > 0) {
			return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'minutes' });
		} else if (expirationCountdown.seconds && expirationCountdown.seconds > 0) {
			return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'seconds' });
		}
	};

	const isExpired = (expiresAt: string) => {
		const now = new Date().getTime();
		const expiration = new Date(expiresAt).getTime();

		return now > expiration;
	};
</script>

<div
	class="w-full flex gap-4 dark:text-immich-gray transition-all border-b border-gray-200 dark:border-gray-600 hover:border-immich-primary dark:hover:border-immich-dark-primary py-4"
>
	<div>
		{#await getAssetInfo()}
			<LoadingSpinner />
		{:then asset}
			<img
				id={asset.id}
				src={api.getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
				alt={asset.id}
				class="object-cover w-[100px] h-[100px] rounded-lg"
				loading="lazy"
				draggable="false"
			/>
		{/await}
	</div>

	<div class="flex flex-col justify-between">
		<div class="info-top">
			<div class="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">
				{#if link.expiresAt}
					{#if isExpired(link.expiresAt)}
						<p class="text-red-600 dark:text-red-400 font-bold">Expired</p>
					{:else}
						<p>
							Expires {getCountDownExpirationDate()}
						</p>
					{/if}
				{:else}
					<p>Expires ∞</p>
				{/if}
			</div>

			<div class="text-sm">
				<div
					class="flex gap-2 place-items-center text-immich-primary dark:text-immich-dark-primary"
				>
					{#if link.type === SharedLinkType.Album}
						<p>
							{link.album?.albumName.toUpperCase()}
						</p>
					{:else if link.type === SharedLinkType.Individual}
						<p>INDIVIDUAL SHARE</p>
					{/if}

					{#if !link.expiresAt || !isExpired(link.expiresAt)}
						<div
							class="hover:cursor-pointer"
							title="Go to share page"
							on:click={() => goto(`/share/${link.key}`)}
							on:keydown={() => goto(`/share/${link.key}`)}
						>
							<OpenInNew />
						</div>
					{/if}
				</div>

				<p class="text-sm">{link.description ?? ''}</p>
			</div>
		</div>

		<div class="info-bottom flex gap-4">
			{#if link.allowUpload}
				<div
					class="text-xs px-2 py-1 bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray flex place-items-center place-content-center rounded-full w-[80px]"
				>
					Upload
				</div>
			{/if}

			{#if link.allowDownload}
				<div
					class="text-xs px-2 py-1 bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray flex place-items-center place-content-center rounded-full w-[100px]"
				>
					Download
				</div>
			{/if}

			{#if link.showExif}
				<div
					class="text-xs px-2 py-1 bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray flex place-items-center place-content-center rounded-full w-[60px]"
				>
					EXIF
				</div>
			{/if}
		</div>
	</div>

	<div class="flex-auto flex flex-col place-content-center place-items-end text-right">
		<div class="flex">
			<CircleIconButton logo={Delete} on:click={() => dispatch('delete')} />
			<CircleIconButton logo={CircleEditOutline} on:click={() => dispatch('edit')} />
			<CircleIconButton logo={ContentCopy} on:click={() => dispatch('copy')} />
		</div>
	</div>
</div>

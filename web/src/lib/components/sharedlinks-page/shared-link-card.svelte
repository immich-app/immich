<script lang="ts">
	import { api, AssetResponseDto, SharedLinkResponseDto, SharedLinkType } from '@api';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import OpenInNew from 'svelte-material-icons/OpenInNew.svelte';
	import Delete from 'svelte-material-icons/TrashCanOutline.svelte';
	import * as luxon from 'luxon';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	export let link: SharedLinkResponseDto;

	let countdownTimeInterval: NodeJS.Timeout;
	let expirationCountdown: luxon.DurationObjectUnits;
	const dispatch = createEventDispatcher();

	onMount(async () => {
		if (link.expiresAt) {
			countdownTimeInterval = setInterval(() => getCountDownExpirationDate(link.expiresAt), 1000);
		}
	});

	onDestroy(() => {
		if (countdownTimeInterval) {
			clearInterval(countdownTimeInterval);
		}
	});
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

	const getCountDownExpirationDate = (expiresAt?: string) => {
		if (!expiresAt) {
			return;
		}

		const expiresAtDate = luxon.DateTime.fromISO(new Date(expiresAt).toISOString());
		const now = luxon.DateTime.now();

		expirationCountdown = expiresAtDate
			.diff(now, ['days', 'hours', 'minutes', 'seconds'])
			.toObject();
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
				src={`/api/asset/thumbnail/${asset.id}?format=WEBP`}
				alt={asset.id}
				class={`object-cover w-[100px] h-[100px] rounded-tl-lg rounded-bl-lg`}
				loading="lazy"
			/>
		{/await}
	</div>

	<div class="mt-2 pb-2">
		<div class="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400">
			{#if link.expiresAt}
				{#if isExpired(link.expiresAt)}
					<p class="text-red-600 dark:text-red-400 font-bold">Expired</p>
				{:else if expirationCountdown}
					<p>
						Expires in {expirationCountdown.days ?? 0}:{expirationCountdown.hours ??
							0}:{expirationCountdown.minutes ?? 0}:{expirationCountdown.seconds?.toFixed(0) ?? 0}
					</p>
				{:else}
					<LoadingSpinner />
				{/if}
			{:else}
				<p>Expires ∞</p>
			{/if}
		</div>

		<div class="text-sm">
			<div class="flex gap-2 place-items-center text-immich-primary dark:text-immich-dark-primary">
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
						on:click={() => goto(`/share/${link.id}`)}
						on:keydown={() => goto(`/share/${link.id}`)}
					>
						<OpenInNew />
					</div>
				{/if}
			</div>

			<p class="text-sm">{link.description ?? ''}</p>
		</div>
	</div>

	<div class="flex-auto flex flex-col place-content-center place-items-end text-right">
		<div class="flex">
			<CircleIconButton logo={Delete} on:click={() => dispatch('delete')} />
		</div>
	</div>
</div>

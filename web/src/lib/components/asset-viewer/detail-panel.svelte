<script lang="ts">
	import Close from 'svelte-material-icons/Close.svelte';
	import Calendar from 'svelte-material-icons/Calendar.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
	import { createEventDispatcher } from 'svelte';
	import { AssetResponseDto, AlbumResponseDto } from '@api';
	import { asByteUnitString } from '../../utils/byte-units';
	import { locale } from '$lib/stores/preferences.store';
	import type { LatLngTuple } from 'leaflet';

	export let asset: AssetResponseDto;
	export let albums: AlbumResponseDto[] = [];

	$: latlng = (() => {
		const lat = asset.exifInfo?.latitude;
		const lng = asset.exifInfo?.longitude;

		if (lat && lng) {
			return [lat, lng] as LatLngTuple;
		}
	})();

	const dispatch = createEventDispatcher();

	const getMegapixel = (width: number, height: number): number | undefined => {
		const megapixel = Math.round((height * width) / 1_000_000);

		if (megapixel) {
			return megapixel;
		}

		return undefined;
	};
</script>

<section class="p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
	<div class="flex place-items-center gap-2">
		<button
			class="rounded-full p-3 flex place-items-center place-content-center hover:bg-gray-200 transition-colors dark:text-immich-dark-fg dark:hover:bg-gray-900"
			on:click={() => dispatch('close')}
		>
			<Close size="24" />
		</button>

		<p class="text-immich-fg dark:text-immich-dark-fg text-lg">Info</p>
	</div>

	<div class="px-4 py-4">
		{#if !asset.exifInfo}
			<p class="text-sm pb-4">NO EXIF INFO AVAILABLE</p>
		{:else}
			<p class="text-sm pb-4">DETAILS</p>
		{/if}

		{#if asset.exifInfo?.dateTimeOriginal}
			{@const assetDateTimeOriginal = new Date(asset.exifInfo.dateTimeOriginal)}
			<div class="flex gap-4 py-4">
				<div>
					<Calendar size="24" />
				</div>

				<div>
					<p>
						{assetDateTimeOriginal.toLocaleDateString($locale, {
							month: 'short',
							day: 'numeric',
							year: 'numeric'
						})}
					</p>
					<div class="flex gap-2 text-sm">
						<p>
							{assetDateTimeOriginal.toLocaleString($locale, {
								weekday: 'short',
								hour: 'numeric',
								minute: '2-digit',
								timeZoneName: 'longOffset'
							})}
						</p>
					</div>
				</div>
			</div>{/if}

		{#if asset.exifInfo?.fileSizeInByte}
			<div class="flex gap-4 py-4">
				<div><ImageOutline size="24" /></div>

				<div>
					<p>{`${asset.exifInfo.imageName}.${asset.originalPath.split('.')[1]}` || ''}</p>
					<div class="flex text-sm gap-2">
						{#if asset.exifInfo.exifImageHeight && asset.exifInfo.exifImageWidth}
							{#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
								<p>
									{getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
								</p>
							{/if}

							<p>{asset.exifInfo.exifImageHeight} x {asset.exifInfo.exifImageWidth}</p>
						{/if}
						<p>{asByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if asset.exifInfo?.fNumber}
			<div class="flex gap-4 py-4">
				<div><CameraIris size="24" /></div>

				<div>
					<p>{asset.exifInfo.make || ''} {asset.exifInfo.model || ''}</p>
					<div class="flex text-sm gap-2">
						<p>{`ƒ/${asset.exifInfo.fNumber.toLocaleString($locale)}` || ''}</p>

						{#if asset.exifInfo.exposureTime}
							<p>{`${asset.exifInfo.exposureTime}`}</p>
						{/if}

						{#if asset.exifInfo.focalLength}
							<p>{`${asset.exifInfo.focalLength.toLocaleString($locale)} mm`}</p>
						{/if}

						{#if asset.exifInfo.iso}
							<p>
								{`ISO${asset.exifInfo.iso}`}
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		{#if asset.exifInfo?.city}
			<div class="flex gap-4 py-4">
				<div><MapMarkerOutline size="24" /></div>

				<div>
					<p>{asset.exifInfo.city}</p>
					<div class="flex text-sm gap-2">
						<p>{asset.exifInfo.state}</p>
					</div>
					<div class="flex text-sm gap-2">
						<p>{asset.exifInfo.country}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

{#if latlng}
	<div class="h-[360px]">
		{#await import('../shared-components/leaflet') then { Map, TileLayer, Marker }}
			<Map {latlng} zoom={14}>
				<TileLayer
					urlTemplate={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
					options={{
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
					}}
				/>
				<Marker {latlng} popupContent="{latlng[0].toFixed(7)},{latlng[1].toFixed(7)}" />
			</Map>
		{/await}
	</div>
{/if}

<section class="p-2 dark:text-immich-dark-fg">
	<div class="px-4 py-4">
		{#if albums.length > 0}
			<p class="text-sm pb-4 ">APPEARS IN</p>
		{/if}
		{#each albums as album}
			<a data-sveltekit-preload-data="hover" href={`/albums/${album.id}`}>
				<div
					class="flex gap-4 py-2 hover:cursor-pointer"
					on:click={() => dispatch('click', album)}
					on:keydown={() => dispatch('click', album)}
				>
					<div>
						<img
							alt={album.albumName}
							class="w-[50px] h-[50px] object-cover rounded"
							src={`/api/asset/thumbnail/${album.albumThumbnailAssetId}?format=JPEG`}
							draggable="false"
						/>
					</div>

					<div class="mt-auto mb-auto">
						<p class="dark:text-immich-dark-primary">{album.albumName}</p>
						<div class="flex gap-2 text-sm">
							<p>{album.assetCount} items</p>
							{#if album.shared}
								<p>· Shared</p>
							{/if}
						</div>
					</div>
				</div>
			</a>
		{/each}
	</div>
</section>

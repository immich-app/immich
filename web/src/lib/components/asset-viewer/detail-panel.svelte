<script lang="ts">
	import Close from 'svelte-material-icons/Close.svelte';
	import Calendar from 'svelte-material-icons/Calendar.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
	import moment from 'moment';
	import { createEventDispatcher, onMount } from 'svelte';
	import { browser } from '$app/env';
	import { env } from '$env/dynamic/public';
	import { AssetResponseDto, AlbumResponseDto } from '@api';

	type Leaflet = typeof import('leaflet');
	type LeafletMap = import('leaflet').Map;
	type LeafletMarker = import('leaflet').Marker;

	// Map Property
	let map: LeafletMap;
	let leaflet: Leaflet;
	let marker: LeafletMarker;

	export let asset: AssetResponseDto;
	$: if (asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null) {
		drawMap(asset.exifInfo.latitude, asset.exifInfo.longitude);
	}

	export let albums: AlbumResponseDto[];

	onMount(async () => {
		if (browser) {
			if (asset.exifInfo?.latitude != null && asset.exifInfo?.longitude != null) {
				await drawMap(asset.exifInfo.latitude, asset.exifInfo.longitude);
			}

			// remove timezone when user not config PUBLIC_TZ var. Etc/UTC is used in default.
			if (asset.exifInfo?.dateTimeOriginal && !env.PUBLIC_TZ) {
				const dateTimeOriginal = asset.exifInfo.dateTimeOriginal;

				asset.exifInfo.dateTimeOriginal = dateTimeOriginal.slice(0, dateTimeOriginal.length - 1);
			}
		}
	});

	async function drawMap(lat: number, lon: number) {
		if (!leaflet) {
			leaflet = await import('leaflet');
		}

		if (!map) {
			map = leaflet.map('map');
			leaflet
				.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				})
				.addTo(map);
		}

		if (marker) {
			map.removeLayer(marker);
		}

		map.setView([lat || 0, lon || 0], 17);

		marker = leaflet.marker([lat || 0, lon || 0]);
		marker.bindPopup(`${(lat || 0).toFixed(7)},${(lon || 0).toFixed(7)}`);
		map.addLayer(marker);
	}

	const dispatch = createEventDispatcher();
	const getHumanReadableString = (sizeInByte: number) => {
		const pepibyte = 1.126 * Math.pow(10, 15);
		const tebibyte = 1.1 * Math.pow(10, 12);
		const gibibyte = 1.074 * Math.pow(10, 9);
		const mebibyte = 1.049 * Math.pow(10, 6);
		const kibibyte = 1024;
		// Pebibyte
		if (sizeInByte >= pepibyte) {
			// Pe
			return `${(sizeInByte / pepibyte).toFixed(1)}PB`;
		} else if (tebibyte <= sizeInByte && sizeInByte < pepibyte) {
			// Te
			return `${(sizeInByte / tebibyte).toFixed(1)}TB`;
		} else if (gibibyte <= sizeInByte && sizeInByte < tebibyte) {
			// Gi
			return `${(sizeInByte / gibibyte).toFixed(1)}GB`;
		} else if (mebibyte <= sizeInByte && sizeInByte < gibibyte) {
			// Mega
			return `${(sizeInByte / mebibyte).toFixed(1)}MB`;
		} else if (kibibyte <= sizeInByte && sizeInByte < mebibyte) {
			// Kibi
			return `${(sizeInByte / kibibyte).toFixed(1)}KB`;
		} else {
			return `${sizeInByte}B`;
		}
	};

	const getMegapixel = (width: number, height: number): number | undefined => {
		const megapixel = Math.round((height * width) / 1_000_000);

		if (megapixel) {
			return megapixel;
		}

		return undefined;
	};
</script>

<section class="p-2">
	<div class="flex place-items-center gap-2">
		<button
			class="rounded-full p-3 flex place-items-center place-content-center hover:bg-gray-200 transition-colors"
			on:click={() => dispatch('close')}
		>
			<Close size="24" color="#232323" />
		</button>

		<p class="text-immich-fg text-lg">Info</p>
	</div>

	<div class="px-4 py-4">
		{#if !asset.exifInfo}
			<p class="text-sm pb-4">NO EXIF INFO AVAILABLE</p>
		{:else}
			<p class="text-sm pb-4">DETAILS</p>
		{/if}

		{#if asset.exifInfo?.dateTimeOriginal}
			<div class="flex gap-4 py-4">
				<div>
					<Calendar size="24" />
				</div>

				<div>
					<p>{moment(asset.exifInfo.dateTimeOriginal).format('MMM DD, YYYY')}</p>
					<div class="flex gap-2 text-sm">
						<p>
							{moment(asset.exifInfo.dateTimeOriginal).format('ddd, hh:mm A')}
						</p>
						<p>GMT{moment(asset.exifInfo.dateTimeOriginal).format('Z')}</p>
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
									{getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}MP
								</p>
							{/if}

							<p>{asset.exifInfo.exifImageHeight} x {asset.exifInfo.exifImageWidth}</p>
						{/if}
						<p>{getHumanReadableString(asset.exifInfo.fileSizeInByte)}</p>
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
						<p>{`f/${asset.exifInfo.fNumber}` || ''}</p>

						{#if asset.exifInfo.exposureTime}
							<p>{`1/${Math.floor(1 / asset.exifInfo.exposureTime)}`}</p>
						{/if}

						{#if asset.exifInfo.focalLength}
							<p>{`${asset.exifInfo.focalLength} mm`}</p>
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
						<p>{asset.exifInfo.state},</p>
						<p>{asset.exifInfo.country}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<div class={`${asset.exifInfo?.latitude ? 'visible' : 'hidden'}`}>
	<div class="h-[360px] w-full" id="map" />
</div>

<section class="p-2">
	<div class="px-4 py-4">
		{#if albums.length > 0}
			<p class="text-sm pb-4">APPEARS IN</p>
		{/if}
		{#each albums as album}
			<a sveltekit:prefetch href={`/albums/${album.id}`}>
				<div class="flex gap-4 py-2 hover:cursor-pointer" on:click={() => dispatch('click', album)}>
					<div>
						<img
							alt={album.albumName}
							class="w-[50px] h-[50px] object-cover rounded"
							src={`/api/asset/thumbnail/${album.albumThumbnailAssetId}?format=JPEG`}
						/>
					</div>

					<div class="mt-auto mb-auto">
						<p>{album.albumName}</p>
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

<style>
	@import 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
</style>

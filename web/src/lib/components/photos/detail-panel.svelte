<script lang="ts">
	import Close from 'svelte-material-icons/Close.svelte';
	import Calendar from 'svelte-material-icons/Calendar.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import CameraIris from 'svelte-material-icons/CameraIris.svelte';
	import moment from 'moment';
	import type { ImmichAsset, ImmichExif } from '../../models/immich-asset';
	import { createEventDispatcher } from 'svelte';

	export let exifInfo: ImmichExif;
	export let assetInfo: ImmichAsset;

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
</script>

<section class="p-2">
	<div class="flex place-items-center gap-2">
		<button
			class="rounded-full p-3 flex place-items-center place-content-center hover:bg-gray-200 transition-colors"
			on:click={() => dispatch('close')}
		>
			<Close size="24" color="#232323" />
		</button>

		<p class="text-black text-lg">Info</p>
	</div>

	<div class="px-4 py-4">
		<code>
			{exifInfo.latitude}
			{exifInfo.longitude}
		</code>
		<p class="text-sm pb-4">DETAILS</p>

		{#if exifInfo.dateTimeOriginal}
			<div class="flex gap-4 py-4">
				<div>
					<Calendar size="24" />
				</div>

				<div>
					<p>{moment(exifInfo.dateTimeOriginal).format('MMM DD')}</p>
					<div class="flex gap-2 text-sm">
						<p>
							{moment(
								exifInfo.dateTimeOriginal.toString().slice(0, exifInfo.dateTimeOriginal.toString().length - 1),
							).format('ddd, hh:mm A')}
						</p>
						<p>GMT{moment(exifInfo.dateTimeOriginal).format('Z')}</p>
					</div>
				</div>
			</div>{/if}

		<div class="flex gap-4 py-4">
			<div><ImageOutline size="24" /></div>

			<div>
				<p>{`${exifInfo.imageName}.${assetInfo.originalPath.split('.')[1]}` || ''}</p>
				<div class="flex text-sm gap-2">
					<p>{((exifInfo.exifImageHeight * exifInfo.exifImageWidth) / 1_000_000).toFixed(0)}MP</p>
					<p>{exifInfo.exifImageHeight} x {exifInfo.exifImageWidth}</p>
					<p>{getHumanReadableString(exifInfo.fileSizeInByte)}</p>
				</div>
			</div>
		</div>

		<div class="flex gap-4 py-4">
			<div><CameraIris size="24" /></div>

			<div>
				<p>{exifInfo.make || ''} {exifInfo.model || ''}</p>
				<div class="flex text-sm gap-2">
					<p>{`f/${exifInfo.fNumber}` || ''}</p>
					<p>{`1/${1 / exifInfo.exposureTime}` || ''}</p>
					<p>{`${exifInfo.focalLength}mm` || ''}</p>
					<p>{`ISO${exifInfo.iso}` || ''}</p>
				</div>
			</div>
		</div>
	</div>
</section>

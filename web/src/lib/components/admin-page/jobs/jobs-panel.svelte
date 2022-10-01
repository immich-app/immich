<script lang="ts">
	import {
		ImmichNotification,
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { AllJobStatusResponseDto, api, JobType } from '@api';
	import { onDestroy, onMount } from 'svelte';
	import JobTile from './job-tile.svelte';

	let allJobsStatus: AllJobStatusResponseDto;
	let setIntervalHandler: NodeJS.Timer;
	onMount(async () => {
		const { data } = await api.jobApi.getAllJobsStatus();
		allJobsStatus = data;

		setIntervalHandler = setInterval(async () => {
			const { data } = await api.jobApi.getAllJobsStatus();
			allJobsStatus = data;
		}, 1000);
	});

	onDestroy(() => {
		clearInterval(setIntervalHandler);
	});

	const runThumbnailGeneration = async () => {
		try {
			const { data } = await api.jobApi.create({
				jobType: JobType.ThumbnailGeneration
			});

			if (data) {
				notificationController.show({
					message: `Thumbnail generation job started for ${data} asset`,
					type: NotificationType.Info
				});
			} else {
				notificationController.show({
					message: `No missing thumbnails found`,
					type: NotificationType.Info
				});
			}
		} catch (e) {
			console.log('[ERROR] runThumbnailGeneration', e);

			notificationController.show({
				message: `Error running thumbnail generation job, check console for more detail`,
				type: NotificationType.Error
			});
		}
	};

	const runExtractEXIF = async () => {
		try {
			const { data } = await api.jobApi.create({
				jobType: JobType.MetadataExtraction
			});

			if (data) {
				notificationController.show({
					message: `Extract EXIF job started for ${data} asset`,
					type: NotificationType.Info
				});
			} else {
				notificationController.show({
					message: `No missing EXIF found`,
					type: NotificationType.Info
				});
			}
		} catch (e) {
			console.log('[ERROR] runExtractEXIF', e);

			notificationController.show({
				message: `Error running extract EXIF job, check console for more detail`,
				type: NotificationType.Error
			});
		}
	};
</script>

<div class="flex flex-col gap-6">
	<JobTile
		title={'Generate thumbnails'}
		subtitle={'Regenerate missing thumbnail (JPEG, WEBP) for all assets'}
		on:click={runThumbnailGeneration}
		jobStatus={allJobsStatus?.isThumbnailGenerationActive}
	>
		<table class="text-left w-full mt-4">
			<!-- table header -->
			<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12">
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/3 font-medium text-sm">Status</th>
					<th class="text-center w-1/3 font-medium text-sm">Active</th>
					<th class="text-center w-1/3 font-medium text-sm">Waiting</th>
				</tr>
			</thead>
			<tbody class="overflow-y-auto rounded-md w-full max-h-[320px] block border">
				<tr class="text-center flex place-items-center w-full h-[40px]">
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.isThumbnailGenerationActive ? 'Active' : 'Idle'}</td
					>
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.thumbnailGenerationQueueCount.active}</td
					>
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.thumbnailGenerationQueueCount.waiting}</td
					>
				</tr>
			</tbody>
		</table>
	</JobTile>

	<JobTile
		title={'Extract EXIF'}
		subtitle={'Extract missing EXIF information for all assets'}
		on:click={runExtractEXIF}
		jobStatus={allJobsStatus?.isMetadataExtractionActive}
	>
		<table class="text-left w-full mt-4">
			<!-- table header -->
			<thead class="border rounded-md mb-2 bg-gray-50 flex text-immich-primary w-full h-12">
				<tr class="flex w-full place-items-center">
					<th class="text-center w-1/3 font-medium text-sm">Status</th>
					<th class="text-center w-1/3 font-medium text-sm">Active</th>
					<th class="text-center w-1/3 font-medium text-sm">Waiting</th>
				</tr>
			</thead>
			<tbody class="overflow-y-auto rounded-md w-full max-h-[320px] block border">
				<tr class="text-center flex place-items-center w-full h-[40px]">
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.isMetadataExtractionActive ? 'Active' : 'Idle'}</td
					>
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.metadataExtractionQueueCount.active}</td
					>
					<td class="text-sm px-2 w-1/3 text-ellipsis"
						>{allJobsStatus?.metadataExtractionQueueCount.waiting}</td
					>
				</tr>
			</tbody>
		</table>
	</JobTile>
</div>

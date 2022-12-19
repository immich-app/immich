<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { AllJobStatusResponseDto, api, JobCommand, JobId } from '@api';
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
	1;

	onDestroy(() => {
		clearInterval(setIntervalHandler);
	});

	const runThumbnailGeneration = async () => {
		try {
			const { data } = await api.jobApi.sendJobCommand(JobId.ThumbnailGeneration, {
				command: JobCommand.Start
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
			const { data } = await api.jobApi.sendJobCommand(JobId.MetadataExtraction, {
				command: JobCommand.Start
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

	const runMachineLearning = async () => {
		try {
			const { data } = await api.jobApi.sendJobCommand(JobId.MachineLearning, {
				command: JobCommand.Start
			});

			if (data) {
				notificationController.show({
					message: `Object detection job started for ${data} asset`,
					type: NotificationType.Info
				});
			} else {
				notificationController.show({
					message: `No missing object detection found`,
					type: NotificationType.Info
				});
			}
		} catch (e) {
			console.log('[ERROR] runMachineLearning', e);

			notificationController.show({
				message: `Error running machine learning job, check console for more detail`,
				type: NotificationType.Error
			});
		}
	};

	const runTemplateMigration = async () => {
		try {
			const { data } = await api.jobApi.sendJobCommand(JobId.StorageTemplateMigration, {
				command: JobCommand.Start
			});

			if (data) {
				notificationController.show({
					message: `Storage migration started`,
					type: NotificationType.Info
				});
			} else {
				notificationController.show({
					message: `All files have been migrated to the new storage template`,
					type: NotificationType.Info
				});
			}
		} catch (e) {
			console.log('[ERROR] runTemplateMigration', e);

			notificationController.show({
				message: `Error running template migration job, check console for more detail`,
				type: NotificationType.Error
			});
		}
	};
</script>

<div class="flex flex-col gap-10">
	<JobTile
		title={'Generate thumbnails'}
		subtitle={'Regenerate missing thumbnail (JPEG, WEBP)'}
		on:click={runThumbnailGeneration}
		jobStatus={allJobsStatus?.isThumbnailGenerationActive}
		waitingJobCount={allJobsStatus?.thumbnailGenerationQueueCount.waiting}
		activeJobCount={allJobsStatus?.thumbnailGenerationQueueCount.active}
	/>

	<JobTile
		title={'Extract EXIF'}
		subtitle={'Extract missing EXIF information'}
		on:click={runExtractEXIF}
		jobStatus={allJobsStatus?.isMetadataExtractionActive}
		waitingJobCount={allJobsStatus?.metadataExtractionQueueCount.waiting}
		activeJobCount={allJobsStatus?.metadataExtractionQueueCount.active}
	/>

	<JobTile
		title={'Detect objects'}
		subtitle={'Run machine learning process to detect and classify objects'}
		on:click={runMachineLearning}
		jobStatus={allJobsStatus?.isMachineLearningActive}
		waitingJobCount={allJobsStatus?.machineLearningQueueCount.waiting}
		activeJobCount={allJobsStatus?.machineLearningQueueCount.active}
	>
		Note that some asset does not have any object detected, this is normal.
	</JobTile>

	<JobTile
		title={'Storage migration'}
		subtitle={''}
		on:click={runTemplateMigration}
		jobStatus={allJobsStatus?.isStorageMigrationActive}
		waitingJobCount={allJobsStatus?.storageMigrationQueueCount.waiting}
		activeJobCount={allJobsStatus?.storageMigrationQueueCount.active}
	>
		Apply the current
		<a
			href="/admin/system-settings?open=storage-template"
			class="text-immich-primary dark:text-immich-dark-primary">Storage template</a
		>
		to previously uploaded assets
	</JobTile>
</div>

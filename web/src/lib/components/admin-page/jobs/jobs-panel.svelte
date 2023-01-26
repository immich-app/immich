<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { AllJobStatusResponseDto, api, JobCommand, JobId } from '@api';
	import { onDestroy, onMount } from 'svelte';
	import JobTile from './job-tile.svelte';

	let jobs: AllJobStatusResponseDto;
	let timer: NodeJS.Timer;
	let thumbnailGenerationIncludeAll = false;
	let metadataExtractionIncludeAll = false;
	let machineLearningIncludeAll = false;
	let transcodeVideoIncludeAll = false;

	const load = async () => {
		const { data } = await api.jobApi.getAllJobsStatus();
		jobs = data;
	};

	onMount(async () => {
		await load();
		timer = setInterval(async () => await load(), 5_000);
	});

	onDestroy(() => {
		clearInterval(timer);
	});

	const run = async (
		jobId: JobId,
		jobName: string,
		emptyMessage: string,
		includeAllAssets: boolean
	) => {
		try {
			const { data } = await api.jobApi.sendJobCommand(jobId, {
				command: JobCommand.Start,
				includeAllAssets
			});

			if (data) {
				notificationController.show({
					message: `Started ${jobName}`,
					type: NotificationType.Info
				});
			} else {
				notificationController.show({ message: emptyMessage, type: NotificationType.Info });
			}
		} catch (error) {
			handleError(error, `Unable to start ${jobName}`);
		}
	};
</script>

<div class="flex flex-col gap-5">
	{#if jobs}
		<JobTile
			title={'Generate thumbnails'}
			subtitle={'Regenerate JPEG and WebP thumbnails'}
			bind:includeAllAssets={thumbnailGenerationIncludeAll}
			on:click={() =>
				run(
					JobId.ThumbnailGeneration,
					'thumbnail generation',
					'No missing thumbnails found',
					thumbnailGenerationIncludeAll
				)}
			jobCounts={jobs[JobId.ThumbnailGeneration]}
		/>

		<JobTile
			title={'EXTRACT METADATA'}
			subtitle={'Extract metadata information i.e. GPS, resolution...etc'}
			bind:includeAllAssets={metadataExtractionIncludeAll}
			on:click={() =>
				run(
					JobId.MetadataExtraction,
					'extract EXIF',
					'No missing EXIF found',
					metadataExtractionIncludeAll
				)}
			jobCounts={jobs[JobId.MetadataExtraction]}
		/>

		<JobTile
			title={'Detect objects'}
			subtitle={'Run machine learning process to detect and classify objects'}
			bind:includeAllAssets={machineLearningIncludeAll}
			on:click={() =>
				run(
					JobId.MachineLearning,
					'object detection',
					'No missing object detection found',
					machineLearningIncludeAll
				)}
			jobCounts={jobs[JobId.MachineLearning]}
		>
			Note that some assets may not have any objects detected
		</JobTile>

		<JobTile
			title={'Video transcoding'}
			subtitle={'Transcode videos not in the desired format'}
			bind:includeAllAssets={transcodeVideoIncludeAll}
			on:click={() =>
				run(
					JobId.VideoConversion,
					'video conversion',
					'No videos without an encoded version found',
					transcodeVideoIncludeAll
				)}
			jobCounts={jobs[JobId.VideoConversion]}
		/>

		<JobTile
			title={'Storage migration'}
			showOptions={false}
			subtitle={''}
			on:click={() =>
				run(
					JobId.StorageTemplateMigration,
					'storage template migration',
					'All files have been migrated to the new storage template',
					false
				)}
			jobCounts={jobs[JobId.StorageTemplateMigration]}
		>
			Apply the current
			<a
				href="/admin/system-settings?open=storage-template"
				class="text-immich-primary dark:text-immich-dark-primary">Storage template</a
			>
			to previously uploaded assets
		</JobTile>
	{/if}
</div>

<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { AllJobStatusResponseDto, api, JobCommand, JobName } from '@api';
	import { onDestroy, onMount } from 'svelte';
	import JobTile from './job-tile.svelte';

	let jobs: AllJobStatusResponseDto;
	let timer: NodeJS.Timer;

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

	function getJobLabel(jobName: JobName) {
		const names: Record<JobName, string> = {
			[JobName.ThumbnailGenerationQueue]: 'Generate Thumbnails',
			[JobName.MetadataExtractionQueue]: 'Extract Metadata',
			[JobName.VideoConversionQueue]: 'Transcode Videos',
			[JobName.ObjectTaggingQueue]: 'Tag Objects',
			[JobName.ClipEncodingQueue]: 'Clip Encoding',
			[JobName.BackgroundTaskQueue]: 'Background Task',
			[JobName.StorageTemplateMigrationQueue]: 'Storage Template Migration',
			[JobName.SearchQueue]: 'Search'
		};

		return names[jobName];
	}

	const start = async (jobId: JobName, force: boolean) => {
		const label = getJobLabel(jobId);

		try {
			await api.jobApi.sendJobCommand(jobId, { command: JobCommand.Start, force });

			jobs[jobId].active += 1;

			notificationController.show({
				message: `Started job: ${label}`,
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, `Unable to start job: ${label}`);
		}
	};
</script>

<div class="flex flex-col gap-7">
	{#if jobs}
		<JobTile
			title="Generate thumbnails"
			subtitle="Regenerate JPEG and WebP thumbnails"
			on:click={(e) => start(JobName.ThumbnailGenerationQueue, e.detail.force)}
			jobCounts={jobs[JobName.ThumbnailGenerationQueue]}
		/>

		<JobTile
			title="Extract Metadata"
			subtitle="Extract metadata information i.e. GPS, resolution...etc"
			on:click={(e) => start(JobName.MetadataExtractionQueue, e.detail.force)}
			jobCounts={jobs[JobName.MetadataExtractionQueue]}
		/>

		<JobTile
			title="Tag Objects"
			subtitle="Run machine learning to tag objects"
			on:click={(e) => start(JobName.ObjectTaggingQueue, e.detail.force)}
			jobCounts={jobs[JobName.ObjectTaggingQueue]}
		>
			Note that some assets may not have any objects detected
		</JobTile>

		<JobTile
			title="Encode Clip"
			subtitle="Run machine learning to generate clip embeddings"
			on:click={(e) => start(JobName.ClipEncodingQueue, e.detail.force)}
			jobCounts={jobs[JobName.ClipEncodingQueue]}
		/>

		<JobTile
			title="Transcode Videos"
			subtitle="Transcode videos not in the desired format"
			on:click={(e) => start(JobName.VideoConversionQueue, e.detail.force)}
			jobCounts={jobs[JobName.VideoConversionQueue]}
		/>

		<JobTile
			title="Storage migration"
			showOptions={false}
			subtitle={''}
			on:click={(e) => start(JobName.StorageTemplateMigrationQueue, e.detail.force)}
			jobCounts={jobs[JobName.StorageTemplateMigrationQueue]}
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

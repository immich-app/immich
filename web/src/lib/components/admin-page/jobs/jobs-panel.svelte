<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { AllJobStatusResponseDto, api, JobCommand, JobCommandDto, JobName } from '@api';
	import type { ComponentType } from 'svelte';
	import JobTile from './job-tile.svelte';
	import StorageMigrationDescription from './storage-migration-description.svelte';

	export let jobs: AllJobStatusResponseDto;

	type JobDetails = {
		title: string;
		subtitle?: string;
		allowForceCommand?: boolean;
		component?: ComponentType;
		queues: JobName[];
	};

	const jobDetails: { [Key in JobName]?: JobDetails } = {
		[JobName.QueueGenerateThumbnails]: {
			title: 'Generate Thumbnails',
			subtitle: 'Regenerate JPEG and WebP thumbnails',
			queues: [
				JobName.QueueGenerateThumbnails,
				JobName.GenerateJpegThumbnail,
				JobName.GenerateWebpThumbnail
			]
		},
		[JobName.QueueMetadataExtraction]: {
			title: 'Extract Metadata',
			subtitle: 'Extract metadata information i.e. GPS, resolution...etc',
			queues: [
				JobName.QueueMetadataExtraction,
				JobName.ExifExtraction,
				JobName.ExtractVideoMetadata
			]
		},
		[JobName.QueueObjectTagging]: {
			title: 'Tag Objects',
			subtitle:
				'Run machine learning to tag objects\nNote that some assets may not have any objects detected',
			queues: [JobName.QueueObjectTagging, JobName.DetectObjects, JobName.ClassifyImage]
		},
		[JobName.QueueClipEncode]: {
			title: 'Encode Clip',
			subtitle: 'Run machine learning to generate clip embeddings',
			queues: [JobName.QueueClipEncode, JobName.ClipEncode]
		},
		[JobName.QueueVideoConversion]: {
			title: 'Transcode Videos',
			subtitle: 'Transcode videos not in the desired format',
			queues: [JobName.QueueVideoConversion, JobName.VideoConversion]
		},
		[JobName.StorageTemplateMigration]: {
			title: 'Storage Template Migration',
			allowForceCommand: false,
			component: StorageMigrationDescription,
			queues: [JobName.StorageTemplateMigration, JobName.StorageTemplateMigrationSingle]
		}
	};

	const jobDetailsArray = Object.entries(jobDetails) as [JobName, JobDetails][];

	async function runJob(jobId: JobName, jobCommand: JobCommandDto) {
		const title = jobDetails[jobId]?.title;

		try {
			const { data } = await api.jobApi.sendJobCommand(jobId, jobCommand);
			jobs[jobId] = data;

			switch (jobCommand.command) {
				case JobCommand.Empty:
					notificationController.show({
						message: `Cleared jobs for: ${title}`,
						type: NotificationType.Info
					});
					break;
			}
		} catch (error) {
			handleError(error, `Command '${jobCommand.command}' failed for job: ${title}`);
		}
	}
</script>

<div class="flex flex-col gap-7">
	{#each jobDetailsArray as [jobName, { title, subtitle, queues, allowForceCommand, component }]}
		<JobTile
			{title}
			{subtitle}
			{allowForceCommand}
			jobCounts={queues
				.map((jobName) => jobs[jobName].jobCounts)
				.reduce(
					(total, stats) => ({
						active: total.active + stats.active,
						completed: total.completed + stats.completed,
						failed: total.failed + stats.failed,
						delayed: total.delayed + stats.delayed,
						waiting: total.waiting + stats.waiting,
						paused: total.paused + stats.paused
					}),
					{
						active: 0,
						completed: 0,
						failed: 0,
						delayed: 0,
						waiting: 0,
						paused: 0
					}
				)}
			queueStatus={queues
				.map((jobName) => jobs[jobName].queueStatus)
				.reduce(
					(total, stats) => ({
						isActive: total.isActive || stats.isActive,
						isPaused: total.isPaused || stats.isPaused
					}),
					{ isActive: false, isPaused: false }
				)}
			on:command={({ detail }) => runJob(jobName, detail)}
		>
			<svelte:component this={component} />
		</JobTile>
	{/each}
</div>

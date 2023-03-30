<script lang="ts">
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
	};

	const jobDetails: { [Key in JobName]?: JobDetails } = {
		[JobName.ThumbnailGenerationQueue]: {
			title: 'Generate Thumbnails',
			subtitle: 'Regenerate JPEG and WebP thumbnails'
		},
		[JobName.MetadataExtractionQueue]: {
			title: 'Extract Metadata',
			subtitle: 'Extract metadata information i.e. GPS, resolution...etc'
		},
		[JobName.ObjectTaggingQueue]: {
			title: 'Tag Objects',
			subtitle:
				'Run machine learning to tag objects\nNote that some assets may not have any objects detected'
		},
		[JobName.ClipEncodingQueue]: {
			title: 'Encode Clip',
			subtitle: 'Run machine learning to generate clip embeddings'
		},
		[JobName.VideoConversionQueue]: {
			title: 'Transcode Videos',
			subtitle: 'Transcode videos not in the desired format'
		},
		[JobName.StorageTemplateMigrationQueue]: {
			title: 'Storage Template Migration',
			allowForceCommand: false,
			component: StorageMigrationDescription
		}
	};

	const jobDetailsArray = Object.entries(jobDetails) as [JobName, JobDetails][];

	async function runJob(jobId: JobName, jobCommand: JobCommandDto) {
		const title = jobDetails[jobId]?.title;

		try {
			await api.jobApi.sendJobCommand(jobId, jobCommand);

			// TODO: Return actual job status from server and use that.
			switch (jobCommand.command) {
				case JobCommand.Start:
					jobs[jobId].active += 1;
					break;
				case JobCommand.Resume:
					jobs[jobId].active += 1;
					jobs[jobId].paused = 0;
					break;
				case JobCommand.Pause:
					jobs[jobId].paused += 1;
					jobs[jobId].active = 0;
					jobs[jobId].waiting = 0;
					break;
			}
		} catch (error) {
			handleError(error, `Command '${jobCommand.command}' failed for job: ${title}`);
		}
	}
</script>

<div class="flex flex-col gap-7">
	{#each jobDetailsArray as [jobName, { title, subtitle, allowForceCommand, component }]}
		<JobTile
			{title}
			{subtitle}
			{allowForceCommand}
			on:command={({ detail }) => runJob(jobName, detail)}
			jobCounts={jobs[jobName]}
		>
			<svelte:component this={component} />
		</JobTile>
	{/each}
</div>

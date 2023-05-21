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
	import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';

	export let jobs: AllJobStatusResponseDto;

	interface JobDetails {
		title: string;
		subtitle?: string;
		allowForceCommand?: boolean;
		component?: ComponentType;
		handleCommand?: (jobId: JobName, jobCommand: JobCommandDto) => Promise<void>;
	}

	let faceConfirm = false;

	const handleFaceCommand = async (jobId: JobName, dto: JobCommandDto) => {
		if (dto.force) {
			faceConfirm = true;
			return;
		}

		await handleCommand(jobId, dto);
	};

	const onFaceConfirm = () => {
		faceConfirm = false;
		handleCommand(JobName.RecognizeFacesQueue, { command: JobCommand.Start, force: true });
	};

	const jobDetails: Partial<Record<JobName, JobDetails>> = {
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
		[JobName.RecognizeFacesQueue]: {
			title: 'Recognize Faces',
			subtitle: 'Run machine learning to recognize faces',
			handleCommand: handleFaceCommand
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

	async function handleCommand(jobId: JobName, jobCommand: JobCommandDto) {
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

{#if faceConfirm}
	<ConfirmDialogue
		prompt="Are you sure you want to reprocess all faces? This will also clear named people."
		on:confirm={onFaceConfirm}
		on:cancel={() => (faceConfirm = false)}
	/>
{/if}

<div class="flex flex-col gap-7">
	{#each jobDetailsArray as [jobName, { title, subtitle, allowForceCommand, component, handleCommand: handleCommandOverride }]}
		{@const { jobCounts, queueStatus } = jobs[jobName]}
		<JobTile
			{title}
			{subtitle}
			{allowForceCommand}
			{jobCounts}
			{queueStatus}
			on:command={({ detail }) => (handleCommandOverride || handleCommand)(jobName, detail)}
		>
			<svelte:component this={component} />
		</JobTile>
	{/each}
</div>

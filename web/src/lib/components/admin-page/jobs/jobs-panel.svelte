<script lang="ts">
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { handleError } from '$lib/utils/handle-error';
	import { AllJobStatusResponseDto, api, JobCommand, JobCommandDto, JobName } from '@api';
	import type { ComponentType } from 'svelte';
	import Icon from 'svelte-material-icons/DotsVertical.svelte';
	import FaceRecognition from 'svelte-material-icons/FaceRecognition.svelte';
	import FileJpgBox from 'svelte-material-icons/FileJpgBox.svelte';
	import FolderMove from 'svelte-material-icons/FolderMove.svelte';
	import Table from 'svelte-material-icons/Table.svelte';
	import FileXmlBox from 'svelte-material-icons/FileXmlBox.svelte';
	import TagMultiple from 'svelte-material-icons/TagMultiple.svelte';
	import VectorCircle from 'svelte-material-icons/VectorCircle.svelte';
	import Video from 'svelte-material-icons/Video.svelte';
	import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';
	import JobTile from './job-tile.svelte';
	import StorageMigrationDescription from './storage-migration-description.svelte';

	export let jobs: AllJobStatusResponseDto;

	interface JobDetails {
		title: string;
		subtitle?: string;
		allText?: string;
		missingText?: string;
		icon: typeof Icon;
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
			icon: FileJpgBox,
			title: 'Generate Thumbnails',
			subtitle: 'Regenerate JPEG and WebP thumbnails'
		},
		[JobName.MetadataExtractionQueue]: {
			icon: Table,
			title: 'Extract Metadata',
			subtitle: 'Extract metadata information i.e. GPS, resolution...etc'
		},
		[JobName.SidecarQueue]: {
			title: 'Sidecar Metadata',
			icon: FileXmlBox,
			subtitle: 'Discover or synchronize sidecar metadata from the filesystem',
			allText: 'SYNC',
			missingText: 'DISCOVER'
		},
		[JobName.ObjectTaggingQueue]: {
			icon: TagMultiple,
			title: 'Tag Objects',
			subtitle:
				'Run machine learning to tag objects\nNote that some assets may not have any objects detected'
		},
		[JobName.ClipEncodingQueue]: {
			icon: VectorCircle,
			title: 'Encode Clip',
			subtitle: 'Run machine learning to generate clip embeddings'
		},
		[JobName.RecognizeFacesQueue]: {
			icon: FaceRecognition,
			title: 'Recognize Faces',
			subtitle: 'Run machine learning to recognize faces',
			handleCommand: handleFaceCommand
		},
		[JobName.VideoConversionQueue]: {
			icon: Video,
			title: 'Transcode Videos',
			subtitle: 'Transcode videos not in the desired format'
		},
		[JobName.StorageTemplateMigrationQueue]: {
			icon: FolderMove,
			title: 'Storage Template Migration',
			allowForceCommand: false,
			component: StorageMigrationDescription
		}
	};

	const jobDetailsArray = Object.entries(jobDetails) as [JobName, JobDetails][];

	async function handleCommand(jobId: JobName, jobCommand: JobCommandDto) {
		const title = jobDetails[jobId]?.title;

		try {
			const { data } = await api.jobApi.sendJobCommand({ jobId, jobCommandDto: jobCommand });
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
	{#each jobDetailsArray as [jobName, { title, subtitle, allText, missingText, allowForceCommand, icon, component, handleCommand: handleCommandOverride }]}
		{@const { jobCounts, queueStatus } = jobs[jobName]}
		<JobTile
			{icon}
			{title}
			{subtitle}
			allText={allText || 'ALL'}
			missingText={missingText || 'MISSING'}
			{allowForceCommand}
			{jobCounts}
			{queueStatus}
			on:command={({ detail }) => (handleCommandOverride || handleCommand)(jobName, detail)}
		>
			<svelte:component this={component} />
		</JobTile>
	{/each}
</div>

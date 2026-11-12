import { OpenQueryParam } from '#lib/constants.ts';
import JobCreateModal from '#lib/modals/JobCreateModal.svelte';
import { executeMutation } from '#lib/queries/client.ts';
import { emptyQueueMutation, runQueueCommandLegacyMutation, updateQueueMutation } from '#lib/queries/queue.query.ts';
import { Route } from '#lib/route.ts';
import type { HeaderButtonActionItem } from '#lib/types.ts';
import { QueueCommand, QueueName, type QueueResponseDto } from '@immich/sdk';
import { modalManager, toastManager, type ActionItem, type IconLike } from '@immich/ui';
import {
  mdiClose,
  mdiCog,
  mdiContentDuplicate,
  mdiDatabaseOutline,
  mdiFaceRecognition,
  mdiFileCheckOutline,
  mdiFileJpgBox,
  mdiFileXmlBox,
  mdiFolderMove,
  mdiImageSearch,
  mdiLibraryShelves,
  mdiOcr,
  mdiPause,
  mdiPencil,
  mdiPlay,
  mdiPlus,
  mdiStateMachine,
  mdiTable,
  mdiTagFaces,
  mdiTrashCanOutline,
  mdiTrayFull,
  mdiVideo,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';

type QueueItem = {
  icon: IconLike;
  title: string;
  subtitle?: string;
};

export const getQueuesActions = ($t: MessageFormatter, queues: QueueResponseDto[] | undefined) => {
  const pausedQueues = (queues ?? []).filter(({ isPaused }) => isPaused).map(({ name }) => name);

  const ResumePaused: HeaderButtonActionItem = {
    title: $t('resume_paused_jobs', { values: { count: pausedQueues.length } }),
    $if: () => pausedQueues.length > 0,
    icon: mdiPlay,
    onAction: async () => {
      for (const name of pausedQueues) {
        await executeMutation(runQueueCommandLegacyMutation, [
          { name, queueCommandDto: { command: QueueCommand.Resume, force: false } },
        ]);
      }
    },
    data: {
      title: pausedQueues.join(', '),
    },
  };

  const CreateJob: ActionItem = {
    icon: mdiPlus,
    title: $t('admin.create_job'),
    shortcuts: { shift: true, key: 'n' },
    onAction: () => modalManager.show(JobCreateModal, {}),
  };

  const ManageConcurrency: ActionItem = {
    icon: mdiCog,
    title: $t('admin.manage_concurrency'),
    description: $t('admin.manage_concurrency_description'),
    onAction: () => goto(Route.systemSettings({ isOpen: OpenQueryParam.JOB })),
  };

  return { ResumePaused, ManageConcurrency, CreateJob };
};

export const getQueueActions = ($t: MessageFormatter, queue: QueueResponseDto) => {
  const Pause: ActionItem = {
    icon: mdiPause,
    title: $t('pause'),
    $if: () => !queue.isPaused,
    onAction: () => executeMutation(updateQueueMutation, [{ name: queue.name, queueUpdateDto: { isPaused: true } }]),
  };

  const Resume: ActionItem = {
    icon: mdiPlay,
    title: $t('resume'),
    $if: () => queue.isPaused,
    onAction: () => executeMutation(updateQueueMutation, [{ name: queue.name, queueUpdateDto: { isPaused: false } }]),
  };

  const Empty: ActionItem = {
    icon: mdiClose,
    title: $t('clear'),
    onAction: () =>
      executeMutation(emptyQueueMutation, [{ name: queue.name, queueDeleteDto: { failed: false } }], {
        onSuccess: () =>
          toastManager.primary($t('admin.cleared_jobs', { values: { job: asQueueItem($t, queue).title } })),
      }),
  };

  const RemoveFailedJobs: ActionItem = {
    icon: mdiTrashCanOutline,
    color: 'danger',
    title: $t('admin.remove_failed_jobs'),
    onAction: () =>
      executeMutation(
        () => emptyQueueMutation({ success: { toast: true } }),
        [{ name: queue.name, queueDeleteDto: { failed: true } }],
      ),
  };

  return { Pause, Resume, Empty, RemoveFailedJobs };
};

export const asQueueItem = ($t: MessageFormatter, queue: { name: QueueName }): QueueItem => {
  // TODO merge this mapping with data from QueuePanel.svelte
  const items: Record<QueueName, QueueItem> = {
    [QueueName.ThumbnailGeneration]: {
      icon: mdiFileJpgBox,
      title: $t('admin.thumbnail_generation_job'),
      subtitle: $t('admin.thumbnail_generation_job_description'),
    },
    [QueueName.MetadataExtraction]: {
      icon: mdiTable,
      title: $t('admin.metadata_extraction_job'),
      subtitle: $t('admin.metadata_extraction_job_description'),
    },
    [QueueName.Library]: {
      icon: mdiLibraryShelves,
      title: $t('external_libraries'),
      subtitle: $t('admin.library_tasks_description'),
    },
    [QueueName.Sidecar]: {
      title: $t('admin.sidecar_job'),
      icon: mdiFileXmlBox,
      subtitle: $t('admin.sidecar_job_description'),
    },
    [QueueName.SmartSearch]: {
      icon: mdiImageSearch,
      title: $t('admin.machine_learning_smart_search'),
      subtitle: $t('admin.smart_search_job_description'),
    },
    [QueueName.DuplicateDetection]: {
      icon: mdiContentDuplicate,
      title: $t('admin.machine_learning_duplicate_detection'),
      subtitle: $t('admin.duplicate_detection_job_description'),
    },
    [QueueName.FaceDetection]: {
      icon: mdiFaceRecognition,
      title: $t('admin.face_detection'),
      subtitle: $t('admin.face_detection_description'),
    },
    [QueueName.FacialRecognition]: {
      icon: mdiTagFaces,
      title: $t('admin.machine_learning_facial_recognition'),
      subtitle: $t('admin.facial_recognition_job_description'),
    },
    [QueueName.Ocr]: {
      icon: mdiOcr,
      title: $t('admin.machine_learning_ocr'),
      subtitle: $t('admin.ocr_job_description'),
    },
    [QueueName.VideoConversion]: {
      icon: mdiVideo,
      title: $t('admin.video_conversion_job'),
      subtitle: $t('admin.video_conversion_job_description'),
    },
    [QueueName.StorageTemplateMigration]: {
      icon: mdiFolderMove,
      title: $t('admin.storage_template_migration'),
    },
    [QueueName.Migration]: {
      icon: mdiFolderMove,
      title: $t('admin.migration_job'),
      subtitle: $t('admin.migration_job_description'),
    },
    [QueueName.BackgroundTask]: {
      icon: mdiTrayFull,
      title: $t('admin.background_task_job'),
    },
    [QueueName.Search]: {
      icon: '',
      title: $t('search'),
    },
    [QueueName.Notifications]: {
      icon: '',
      title: $t('notifications'),
    },
    [QueueName.BackupDatabase]: {
      icon: mdiDatabaseOutline,
      title: $t('admin.backup_database'),
    },
    [QueueName.Workflow]: {
      icon: mdiStateMachine,
      title: $t('workflows'),
    },
    [QueueName.IntegrityCheck]: {
      icon: mdiFileCheckOutline,
      title: $t('integrity_checks'),
    },
    [QueueName.Editor]: {
      icon: mdiPencil,
      title: $t('editor'),
    },
  };

  return items[queue.name];
};

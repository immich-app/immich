import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { queueManager } from '$lib/managers/queue-manager.svelte';
import JobCreateModal from '$lib/modals/JobCreateModal.svelte';
import type { HeaderButtonActionItem } from '$lib/types';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  emptyQueue,
  getQueue,
  QueueCommand,
  QueueName,
  runQueueCommandLegacy,
  updateQueue,
  type QueueResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem, type IconLike } from '@immich/ui';
import {
  mdiClose,
  mdiCog,
  mdiContentDuplicate,
  mdiDatabaseOutline,
  mdiFaceRecognition,
  mdiFileJpgBox,
  mdiFileXmlBox,
  mdiFolderMove,
  mdiImageSearch,
  mdiLibraryShelves,
  mdiOcr,
  mdiPause,
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
    onAction: () => handleResumePausedJobs(pausedQueues),
    data: {
      title: pausedQueues.join(', '),
    },
  };

  const CreateJob: ActionItem = {
    icon: mdiPlus,
    title: $t('admin.create_job'),
    type: $t('command'),
    shortcuts: { shift: true, key: 'n' },
    onAction: async () => {
      await modalManager.show(JobCreateModal, {});
    },
  };

  const ManageConcurrency: ActionItem = {
    icon: mdiCog,
    title: $t('admin.manage_concurrency'),
    description: $t('admin.manage_concurrency_description'),
    type: $t('page'),
    onAction: () => goto(`${AppRoute.ADMIN_SETTINGS}?isOpen=job`),
  };

  return { ResumePaused, ManageConcurrency, CreateJob };
};

export const getQueueActions = ($t: MessageFormatter, queue: QueueResponseDto) => {
  const Pause: ActionItem = {
    icon: mdiPause,
    title: $t('pause'),
    $if: () => !queue.isPaused,
    onAction: () => handlePauseQueue(queue),
  };

  const Resume: ActionItem = {
    icon: mdiPlay,
    title: $t('resume'),
    $if: () => queue.isPaused,
    onAction: () => handleResumeQueue(queue),
  };

  const Empty: ActionItem = {
    icon: mdiClose,
    title: $t('clear'),
    onAction: () => handleEmptyQueue(queue),
  };

  const RemoveFailedJobs: ActionItem = {
    icon: mdiTrashCanOutline,
    color: 'danger',
    title: $t('admin.remove_failed_jobs'),
    onAction: () => handleRemoveFailedJobs(queue),
  };

  return { Pause, Resume, Empty, RemoveFailedJobs };
};

export const handlePauseQueue = async (queue: QueueResponseDto) => {
  const response = await updateQueue({ name: queue.name, queueUpdateDto: { isPaused: true } });
  eventManager.emit('QueueUpdate', response);
};

export const handleResumeQueue = async (queue: QueueResponseDto) => {
  const response = await updateQueue({ name: queue.name, queueUpdateDto: { isPaused: false } });
  eventManager.emit('QueueUpdate', response);
};

export const handleEmptyQueue = async (queue: QueueResponseDto) => {
  const $t = await getFormatter();
  const item = asQueueItem($t, queue);

  try {
    await emptyQueue({ name: queue.name, queueDeleteDto: { failed: false } });
    const response = await getQueue({ name: queue.name });
    eventManager.emit('QueueUpdate', response);
    toastManager.success($t('admin.cleared_jobs', { values: { job: item.title } }));
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
};

const handleResumePausedJobs = async (queues: QueueName[]) => {
  const $t = await getFormatter();

  try {
    for (const name of queues) {
      await runQueueCommandLegacy({ name, queueCommandDto: { command: QueueCommand.Resume, force: false } });
    }
    await queueManager.refresh();
  } catch (error) {
    handleError(error, $t('admin.failed_job_command', { values: { command: 'resume', job: 'paused jobs' } }));
  }
};

const handleRemoveFailedJobs = async (queue: QueueResponseDto) => {
  const $t = await getFormatter();

  try {
    await emptyQueue({ name: queue.name, queueDeleteDto: { failed: true } });
    const response = await getQueue({ name: queue.name });
    eventManager.emit('QueueUpdate', response);
    toastManager.success();
  } catch (error) {
    handleError(error, $t('errors.something_went_wrong'));
  }
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
  };

  return items[queue.name];
};

export const asQueueSlug = (name: QueueName) => {
  return name.replaceAll(/[A-Z]/g, (m) => '-' + m.toLowerCase());
};

export const fromQueueSlug = (slug: string): QueueName | undefined => {
  const name = slug.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
  if (Object.values(QueueName).includes(name as QueueName)) {
    return name as QueueName;
  }
};

export const getQueueDetailUrl = (queue: QueueResponseDto) => {
  return `${AppRoute.ADMIN_QUEUES}/${asQueueSlug(queue.name)}`;
};

export const handleViewQueue = (queue: QueueResponseDto) => {
  return goto(getQueueDetailUrl(queue));
};

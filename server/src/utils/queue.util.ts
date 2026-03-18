import { QueueName } from 'src/enum';

/**
 * Queues that require machine affinity - jobs must run on the same machine
 * that has the local file. These queues read files from local disk.
 */
const MACHINE_AFFINITY_QUEUES = new Set<QueueName>([
  QueueName.MetadataExtraction,
  QueueName.AssetThumbnailGeneration,
  QueueName.PersonThumbnailGeneration,
  QueueName.VideoConversion,
  QueueName.Sidecar,
  QueueName.FaceDetection,
  QueueName.SmartSearch,
  QueueName.Ocr,
  QueueName.S3Upload,
]);

/**
 * Get the actual queue name to use in Redis/BullMQ.
 * For affinity queues, this appends the machineId as a suffix.
 * For global queues, returns the base queue name unchanged.
 *
 * @param baseQueue - The base queue name (e.g., QueueName.MetadataExtraction)
 * @param machineId - The machine ID to use for affinity queues
 * @returns The actual queue name to use (e.g., "metadataExtraction-abc123")
 */
export function getActualQueueName(baseQueue: QueueName, machineId: string): string {
  if (MACHINE_AFFINITY_QUEUES.has(baseQueue)) {
    return `${baseQueue}-${machineId}`;
  }
  return baseQueue;
}

/**
 * Check if a queue requires machine affinity.
 *
 * @param queue - The queue name to check
 * @returns true if the queue requires machine affinity
 */
export function isAffinityQueue(queue: QueueName): boolean {
  return MACHINE_AFFINITY_QUEUES.has(queue);
}

/**
 * Check if a job is an initial recovery job.
 * Initial recovery jobs have source='recovery' but no machineId yet.
 * These should go to the global queue so any machine can pick them up.
 *
 * @param jobData - The job data object to check
 * @returns true if this is an initial recovery job
 */
export function isInitialRecoveryJob(jobData: { source?: string; machineId?: string } | undefined): boolean {
  return jobData?.source === 'recovery' && !jobData?.machineId;
}

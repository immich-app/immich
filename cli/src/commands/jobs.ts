import {
  AllJobStatusResponseDto,
  getAllJobsStatus,
  JobCommand,
  JobCountsDto,
  JobName,
  JobStatusDto,
  sendJobCommand
} from '@immich/sdk';
import { authenticate, BaseOptions, logError, withError } from 'src/utils';

interface CommonJobStatusOptions {
  jsonOutput?: boolean;
}

interface StartJobOptions extends CommonJobStatusOptions {
  onlyMissing?: boolean;
  refresh?: boolean;
  all?: boolean;

  wait?: boolean;
}

type GetJobStatusOptions = CommonJobStatusOptions;
type PauseJobOptions = GetJobStatusOptions;
type ResumeJobOptions = GetJobStatusOptions;

const JOB_STATUS_COLUMN_HEADERS: Readonly<Record<keyof JobCountsDto, string>> = {
  active: 'Active Jobs',
  delayed: 'Delayed Jobs',
  paused: 'Paused Jobs',
  waiting: 'Waiting Jobs',
  completed: 'Completed Jobs',
  failed: 'Failed Jobs',
};

/**
 * Command entry point for getting the status of jobs.
 * If jobName is provided, it will return the status of that specific job.
 * If jobName is not provided, it will return the status of all jobs.
 * @param jobName Name of the job to check status for, or undefined to get all jobs status.
 * @param baseOptions Immich CLI base options.
 * @param commandOptions Options for the command, such as whether to output in JSON format.
 */
export async function getJobsStatus(jobName: JobName | undefined, baseOptions: BaseOptions, commandOptions: GetJobStatusOptions) {
  await authenticate(baseOptions);

  if (jobName) {
    ensureJobNameIsValid(jobName);
    return getStatusOfSingleJob(jobName, commandOptions);
  } else {
    return getStatusOfAllJobs(commandOptions);
  }
}

/**
 * Command entry point for starting a job.
 * It will ask Immich to start the job with the given name.
 * @param jobName Name of the job to start.
 * @param baseOptions Immich CLI base options.
 * @param commandOptions Options for the command, such as whether to output in JSON format.
 */
export async function startJob(jobName: JobName, baseOptions: BaseOptions, commandOptions: StartJobOptions) {
  await authenticate(baseOptions);
  ensureJobNameIsValid(jobName);

  let force: boolean | undefined;

  // Mimic the behavior of the Immich web UI, based on options provided.
  if (commandOptions.all) {
    force = true;
  } else if (commandOptions.onlyMissing) {
    force = false;
  } else if (commandOptions.refresh) {
    force = undefined;
  }

  const [error, response] = await withError(sendJobCommand({
    id: jobName,
    jobCommandDto: {
      command: JobCommand.Start,
      force: force,
    }
  }));

  if (error) {
    logError(error, `Failed to start job: ${jobName}. Got error`);
    process.exit(1);
  }

  let status = response;

  if (commandOptions.wait && areJobsRunning(status.jobCounts)) {
    status = await waitForJobCompletion(jobName);
  }

  if (commandOptions.jsonOutput) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  const message = commandOptions.wait
    ? `Successfully executed job "${jobName}".`
    : `Successfully queued execution of job "${jobName}".`;

  console.log(message);
}

/**
 * Command entry point for pausing executions of a job, given its name.
 * @param jobName Name of the job to pause executions for.
 * @param baseOptions Immich CLI base options.
 * @param commandOptions Options for the command, such as whether to output in JSON format.
 */
export async function pauseJobExecutions(jobName: JobName, baseOptions: BaseOptions, commandOptions: PauseJobOptions) {
  await authenticate(baseOptions);

  ensureJobNameIsValid(jobName);

  const [error, response] = await withError(sendJobCommand({
    id: jobName,
    jobCommandDto: {
      command: JobCommand.Pause
    }
  }));

  if (error) {
    logError(error, `Failed to pause executions of job "${jobName}". Got error`);
    process.exit(1);
  }

  if (commandOptions.jsonOutput) {
    console.log(JSON.stringify(response.queueStatus, null, 2));
    return;
  }

  console.log(`Successfully paused executions of job "${jobName}".`);
}

/**
 * Command entry point for resuming executions of a job, given its name.
 * @param jobName Job name to resume executions for.
 * @param baseOptions Immich CLI base options.
 * @param commandOptions Options for the command, such as whether to output in JSON format.
 */
export async function resumeJobExecutions(jobName: JobName, baseOptions: BaseOptions, commandOptions: ResumeJobOptions) {
  await authenticate(baseOptions);

  ensureJobNameIsValid(jobName);

  const [error, response] = await withError(sendJobCommand({
    id: jobName,
    jobCommandDto: {
      command: JobCommand.Resume
    }
  }));

  if (error) {
    logError(error, `Failed to resume executions of job "${jobName}". Got error`);
    process.exit(1);
  }

  if (commandOptions.jsonOutput) {
    console.log(JSON.stringify(response.queueStatus, null, 2));
    return;
  }

  console.log(`Successfully resumed executions of job "${jobName}".`);
}

/**
 * An utility function to ensure that the provided job name is valid.
 * If not, it will log an error and exit the process.
 * @param jobName Name of the job to validate.
 */
function ensureJobNameIsValid(jobName: JobName): asserts jobName is JobName {
  const validObjectNames = Object.values(JobName);
  if (!validObjectNames.includes(jobName)) {
    console.error(`Invalid job name: ${jobName}. Valid job names are: ${validObjectNames.join(', ')}`);
    process.exit(1);
  }
}

/**
 * An helper function to get and print to standard output the status of a single job.
 * @param jobName Name of the job to get the status for.
 * @param commandOptions Command options, such as whether to output in JSON format.
 */
async function getStatusOfSingleJob(jobName: JobName, commandOptions: CommonJobStatusOptions) {
  const status = await requestJobsStatus();
  const jobStatus = status[jobName];

  const outputPrefix = commandOptions.jsonOutput ? '' : `Status for requested job "${jobName}": `;
  console.log(outputPrefix, JSON.stringify(jobStatus, null, 2));
}

/**
 * An helper function to get and print to standard output the status of all known jobs.
 * By default, it will print the status in a table format, with one row for each job.
 * @param commandOptions Command options, such as whether to output in JSON format.
 */
async function getStatusOfAllJobs(commandOptions: CommonJobStatusOptions) {
  const status = await requestJobsStatus();

  if (commandOptions.jsonOutput) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }

  console.table(Object.entries(status).map(([name, status]) => {
    const row: Record<string, string | number | boolean> = {
      name,
      isQueueActive: status.queueStatus.isActive,
      isQueuePaused: status.queueStatus.isPaused,
    };

    for (const [key, value] of Object.entries(status.jobCounts)) {
      row[JOB_STATUS_COLUMN_HEADERS[key as keyof JobCountsDto]] = value;
    }

    return row;
  }));
}

/**
 * An utility function to wait for a job to complete.
 * It will poll the job status every second until the job is no longer running.
 * @param jobName Name of the job to wait for completion.
 * @returns A promise that resolves to the final status of the job.
 */
async function waitForJobCompletion(jobName: JobName): Promise<JobStatusDto> {
  while (true) {
    const status = await requestJobsStatus();
    const jobStatus = status[jobName];

    if (!areJobsRunning(jobStatus.jobCounts)) {
      return jobStatus;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

/**
 * An helper function to determine if any jobs are currently running.
 * @param jobCounts Counts of jobs in various states.
 * @returns True if any jobs are running, false otherwise.
 */
function areJobsRunning(jobCounts: JobCountsDto): boolean {
  return !!(jobCounts.active || jobCounts.delayed || jobCounts.paused || jobCounts.waiting);
}

/**
 * An utility function to request the status of all jobs from the Immich server.
 * It will log an error and exit the process if the request fails.
 * @returns A promise that resolves to the status of all jobs.
 */
async function requestJobsStatus(): Promise<AllJobStatusResponseDto> {
  const [error, status] = await withError(getAllJobsStatus());
  if (error) {
    logError(error, 'Failed to get job status. Error');
    process.exit(1);
  }

  return status;
}

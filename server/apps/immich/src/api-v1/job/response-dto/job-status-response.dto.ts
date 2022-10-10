import Bull from 'bull';

export class JobStatusResponseDto {
  isActive!: boolean;
  queueCount!: Bull.JobCounts;
}

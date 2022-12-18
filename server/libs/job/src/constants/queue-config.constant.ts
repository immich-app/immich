import Bull from 'bull';

export const ImmichDefaultJobOptions: Bull.JobOptions = {
  attempts: 3,
  removeOnComplete: true,
  removeOnFail: false,
};

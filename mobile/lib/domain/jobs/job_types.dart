import 'package:immich_mobile/domain/jobs/job_context.dart';
import 'package:immich_mobile/domain/jobs/job_handler.dart';
import 'package:immich_mobile/domain/jobs/local_sync/local_sync.job.dart';
import 'package:immich_mobile/domain/jobs/remote_sync/remote_sync.job.dart';

enum JobType {
  localSync._('local_sync'),
  remoteSync._('remote_sync');

  final String id;
  const JobType._(this.id);
}

JobHandler getJobHandler(JobType type, JobContext context) => switch (type) {
  JobType.localSync => LocalSyncJobHandler(context: context),
  JobType.remoteSync => RemoteSyncJobHandler(context: context),
};

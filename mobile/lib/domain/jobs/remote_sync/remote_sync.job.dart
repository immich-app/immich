import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/domain/jobs/job.dart';
import 'package:immich_mobile/domain/jobs/job_handler.dart';
import 'package:immich_mobile/domain/jobs/job_types.dart';
import 'package:immich_mobile/domain/jobs/remote_sync/remote_sync.service.dart';
import 'package:immich_mobile/domain/jobs/remote_sync/remote_sync_api.repository.dart';
import 'package:immich_mobile/providers/infrastructure/sync.provider.dart';

class RemoteSyncInput {
  final bool syncReset;

  const RemoteSyncInput({this.syncReset = false});
}

class RemoteSyncJob extends Job<RemoteSyncInput, RemoteSyncStatus> {
  @override
  JobType get type => JobType.remoteSync;

  @override
  Duration get idleInterval => const Duration(seconds: 30);

  @override
  Future<void> onIdle() async {
    trigger(const RemoteSyncInput(syncReset: false));
  }
}

class RemoteSyncJobHandler extends JobHandler<RemoteSyncInput> {
  late final RemoteSyncService _remoteSyncService;

  RemoteSyncJobHandler({required super.context}) {
    _remoteSyncService = RemoteSyncService(
      syncApiRepository: context.read(remoteSyncApiRepositoryProvider),
      syncStreamRepository: context.read(syncStreamRepositoryProvider),
    );
  }

  @override
  Future<RemoteSyncStatus> processJob(String jobId, RemoteSyncInput input, CancellationToken token) async {
    final status = await _remoteSyncService.sync(syncReset: input.syncReset, token: token);
    if (status != RemoteSyncStatus.reset) {
      return status;
    }
    return _remoteSyncService.sync(syncReset: false, token: token);
  }
}

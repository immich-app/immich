import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/domain/jobs/job.dart';
import 'package:immich_mobile/domain/jobs/job_handler.dart';
import 'package:immich_mobile/domain/jobs/job_types.dart';
import 'package:immich_mobile/domain/jobs/local_sync/local_sync.service.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';

class LocalSyncInput {
  final bool fullSync;

  const LocalSyncInput({this.fullSync = false});
}

class LocalSyncJob extends Job<LocalSyncInput, void> {
  @override
  JobType get type => JobType.localSync;

  @override
  Duration get idleInterval => const Duration(minutes: 3);

  @override
  Future<void> onIdle() async {
    // Trigger a partial sync on idle
    trigger(const LocalSyncInput(fullSync: false));
  }
}

class LocalSyncJobHandler extends JobHandler<LocalSyncInput> {
  late final LocalSyncService _localSyncService;

  LocalSyncJobHandler({required super.context}) {
    LocalSyncService(
      localAlbumRepository: context.read(localAlbumRepository),
      nativeSyncApi: context.read(nativeSyncApiProvider),
    );
  }

  @override
  bool shouldSkipInput(LocalSyncInput newInput, LocalSyncInput existingInput) {
    // Skip if a full sync is already scheduled/running
    if (existingInput.fullSync) {
      return true;
    }

    return false;
  }

  @override
  Future<void> processJob(String jobId, LocalSyncInput input, CancellationToken token) =>
      _localSyncService.sync(full: input.fullSync, token: token);
}

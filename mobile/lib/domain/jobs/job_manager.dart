import 'package:immich_mobile/domain/jobs/job.dart';
import 'package:immich_mobile/domain/jobs/job_types.dart';
import 'package:immich_mobile/domain/jobs/local_sync/local_sync.job.dart';
import 'package:immich_mobile/domain/jobs/remote_sync/remote_sync.job.dart';

class _JobRegistry {
  final Map<String, Job> _jobs = {};

  void register<I, O>(Job<I, O> job) {
    _jobs[job.type.id] = job;
  }

  Job<I, O>? get<I, O>(String id) {
    return _jobs[id] as Job<I, O>?;
  }

  List<Job> get all => _jobs.values.toList();

  Future<void> startAll() async {
    await Future.wait(_jobs.values.map((j) => j.start()));
  }

  Future<void> stopAll() async {
    await Future.wait(_jobs.values.map((j) => j.stop()));
  }

  void cancelAll() {
    for (final job in _jobs.values) {
      job.cancelAll();
    }
  }
}

class JobManager {
  final _JobRegistry _registry = _JobRegistry();

  bool _isInitialized = false;
  static final JobManager I = JobManager._();
  JobManager._();

  LocalSyncJob? get localSyncJob => _registry.get<LocalSyncInput, void>(JobType.localSync.id) as LocalSyncJob?;

  RemoteSyncJob? get remoteSyncJob => _registry.get<void, void>(JobType.remoteSync.id) as RemoteSyncJob?;

  void init() {
    if (_isInitialized) {
      return;
    }

    _registry.register(LocalSyncJob());
    _registry.register(RemoteSyncJob());
    _isInitialized = true;
  }

  Future<void> start() => _registry.startAll();

  Future<void> stop() => _registry.stopAll();

  void triggerLocalSync({bool fullSync = false}) {
    localSyncJob?.trigger(LocalSyncInput(fullSync: fullSync));
  }

  void triggerRemoteSync({bool syncReset = false}) {
    remoteSyncJob?.trigger(RemoteSyncInput(syncReset: syncReset));
  }
}

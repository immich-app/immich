import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/domain/utils/isolate_lock_manager.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';

final backgroundSyncProvider = Provider<BackgroundSyncManager>((ref) {
  final syncStatusNotifier = ref.read(syncStatusProvider.notifier);
  final manager = BackgroundSyncManager(
    onRemoteSyncStart: syncStatusNotifier.startRemoteSync,
    onRemoteSyncComplete: syncStatusNotifier.completeRemoteSync,
    onRemoteSyncError: syncStatusNotifier.errorRemoteSync,
    onLocalSyncStart: syncStatusNotifier.startLocalSync,
    onLocalSyncComplete: syncStatusNotifier.completeLocalSync,
    onLocalSyncError: syncStatusNotifier.errorLocalSync,
    onHashingStart: syncStatusNotifier.startHashJob,
    onHashingComplete: syncStatusNotifier.completeHashJob,
    onHashingError: syncStatusNotifier.errorHashJob,
  );
  ref.onDispose(manager.cancel);
  return manager;
});

final isolateLockManagerProvider = Provider.family<IsolateLockManager, String>((ref, name) {
  return IsolateLockManager(portName: name);
});

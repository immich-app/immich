import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';

final backgroundSyncProvider = Provider<BackgroundSyncManager>((ref) {
  final syncStatusNotifier = ref.read(syncStatusProvider.notifier);
  final manager = BackgroundSyncManager(
    onRemoteSyncStart: syncStatusNotifier.startRemoteSync,
    onRemoteSyncComplete: syncStatusNotifier.completeRemoteSync,
    onRemoteSyncError: syncStatusNotifier.errorRemoteSync,
  );
  ref.onDispose(manager.cancel);
  return manager;
});

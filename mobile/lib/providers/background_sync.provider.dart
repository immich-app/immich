import 'package:drift/drift.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';

final backgroundSyncProvider = Provider<BackgroundSyncManager>((ref) {
  final syncStatusNotifier = ref.read(syncStatusProvider.notifier);
  final db = ref.read(driftProvider);

  final manager = BackgroundSyncManager(
    onRemoteSyncStart: () {
      syncStatusNotifier.startRemoteSync();
      final backupProvider = ref.read(driftBackupProvider.notifier);
      if (backupProvider.mounted) {
        backupProvider.updateError(BackupError.none);
      }
    },
    onRemoteSyncComplete: (isSuccess) {
      syncStatusNotifier.completeRemoteSync();
      final backupProvider = ref.read(driftBackupProvider.notifier);
      if (backupProvider.mounted) {
        backupProvider.updateError(isSuccess == true ? BackupError.none : BackupError.syncFailed);
      }
      db.notifyUpdates({TableUpdate.onTable(db.remoteAssetEntity, kind: UpdateKind.update)});
    },
    onRemoteSyncError: syncStatusNotifier.errorRemoteSync,
    onLocalSyncStart: syncStatusNotifier.startLocalSync,
    onLocalSyncComplete: () {
      syncStatusNotifier.completeLocalSync();
      db.notifyUpdates({TableUpdate.onTable(db.localAssetEntity, kind: UpdateKind.update)});
    },
    onLocalSyncError: syncStatusNotifier.errorLocalSync,
    onHashingStart: syncStatusNotifier.startHashJob,
    onHashingComplete: syncStatusNotifier.completeHashJob,
    onHashingError: syncStatusNotifier.errorHashJob,
    onCloudIdSyncStart: syncStatusNotifier.startCloudIdSync,
    onCloudIdSyncComplete: syncStatusNotifier.completeCloudIdSync,
    onCloudIdSyncError: syncStatusNotifier.errorCloudIdSync,
  );
  ref.onDispose(manager.cancel);
  return manager;
});

import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/metadata.repository.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/settings/backup_settings/drift_backup_settings.dart';
import 'package:logging/logging.dart';

@RoutePage()
class DriftBackupOptionsPage extends ConsumerWidget {
  const DriftBackupOptionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    bool hasPopped = false;
    final previousBackup = ref.read(metadataProvider).appConfig.backup;
    final previousCellularForVideos = previousBackup.useCellularForVideos;
    final previousCellularForPhotos = previousBackup.useCellularForPhotos;
    return PopScope(
      onPopInvokedWithResult: (didPop, result) async {
        // There is an issue with Flutter where the pop event
        // can be triggered multiple times, so we guard it with _hasPopped

        final currentBackup = ref.read(metadataProvider).appConfig.backup;
        final currentCellularForVideos = currentBackup.useCellularForVideos;
        final currentCellularForPhotos = currentBackup.useCellularForPhotos;

        if (currentCellularForVideos == previousCellularForVideos &&
            currentCellularForPhotos == previousCellularForPhotos) {
          return;
        }

        if (didPop && !hasPopped) {
          hasPopped = true;

          final currentUser = ref.read(currentUserProvider);
          if (currentUser == null) {
            return;
          }

          await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
          final isBackupEnabled = MetadataRepository.instance.appConfig.backup.enabled;
          if (!isBackupEnabled) {
            return;
          }

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text("network_requirements_updated".t(context: context)),
              duration: const Duration(seconds: 4),
            ),
          );

          final backupNotifier = ref.read(driftBackupProvider.notifier);
          final backgroundSync = ref.read(backgroundSyncProvider);
          backupNotifier.stopForegroundBackup();
          unawaited(
            backgroundSync.syncRemote().then((success) {
              if (success) {
                return backupNotifier.startForegroundBackup(currentUser.id);
              } else {
                Logger('DriftBackupOptionsPage').warning('Background sync failed, not starting backup');
              }
            }),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text("backup_options".t(context: context))),
        body: const DriftBackupSettings(),
      ),
    );
  }
}

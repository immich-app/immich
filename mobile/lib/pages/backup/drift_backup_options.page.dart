import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

@RoutePage()
class DriftBackupOptionsPage extends ConsumerWidget {
  const DriftBackupOptionsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    bool hasPopped = false;
    final previousWifiReqForVideos = Store.get(StoreKey.useWifiForUploadVideos);
    final previousWifiReqForPhotos = Store.get(StoreKey.useWifiForUploadPhotos);
    return PopScope(
      onPopInvokedWithResult: (didPop, result) async {
        // There is an issue with Flutter where the pop event
        // can be triggered multiple times, so we guard it with _hasPopped

        final currentWifiReqForVideos = Store.get(StoreKey.useWifiForUploadVideos);
        final currentWifiReqForPhotos = Store.get(StoreKey.useWifiForUploadPhotos);

        if (currentWifiReqForVideos == previousWifiReqForVideos &&
            currentWifiReqForPhotos == previousWifiReqForPhotos) {
          return;
        }

        if (didPop && !hasPopped) {
          hasPopped = true;

          final currentUser = ref.read(currentUserProvider);
          if (currentUser == null) {
            return;
          }

          await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
          final isBackupEnabled = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
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
          backupNotifier.cancel().then((_) {
            backupNotifier.startBackup(currentUser.id);
          });
        }
      },
      child: Scaffold(
        appBar: AppBar(title: Text("backup_options".t(context: context))),
        body: ListView(
          children: [
            const _UseWifiForUploadVideosButton(),
            const Divider(indent: 16, endIndent: 16),
            const _UseWifiForUploadPhotosButton(),
          ],
        ),
      ),
    );
  }
}

class _UseWifiForUploadVideosButton extends ConsumerWidget {
  const _UseWifiForUploadVideosButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valueStream = Store.watch(StoreKey.useWifiForUploadVideos);

    return ListTile(
      title: Text("videos".t(context: context)),
      subtitle: Text("network_requirement_videos_upload".t(context: context)),
      trailing: StreamBuilder(
        stream: valueStream,
        initialData: Store.get(StoreKey.useWifiForUploadVideos),
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref
                  .read(appSettingsServiceProvider)
                  .setSetting(AppSettingsEnum.useCellularForUploadVideos, newValue);
            },
          );
        },
      ),
    );
  }
}

class _UseWifiForUploadPhotosButton extends ConsumerWidget {
  const _UseWifiForUploadPhotosButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final valueStream = Store.watch(StoreKey.useWifiForUploadPhotos);

    return ListTile(
      title: Text("photos".t(context: context)),
      subtitle: Text("network_requirement_photos_upload".t(context: context)),
      trailing: StreamBuilder(
        stream: valueStream,
        initialData: Store.get(StoreKey.useWifiForUploadPhotos),
        builder: (context, snapshot) {
          final value = snapshot.data ?? false;
          return Switch(
            value: value,
            onChanged: (bool newValue) async {
              await ref
                  .read(appSettingsServiceProvider)
                  .setSetting(AppSettingsEnum.useCellularForUploadPhotos, newValue);
            },
          );
        },
      ),
    );
  }
}

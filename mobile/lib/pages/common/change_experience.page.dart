import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:permission_handler/permission_handler.dart';

@RoutePage()
class ChangeExperiencePage extends ConsumerStatefulWidget {
  final bool switchingToBeta;

  const ChangeExperiencePage({super.key, required this.switchingToBeta});

  @override
  ConsumerState createState() => _ChangeExperiencePageState();
}

class _ChangeExperiencePageState extends ConsumerState<ChangeExperiencePage> {
  bool hasMigrated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _handleMigration());
  }

  Future<void> _handleMigration() async {
    if (widget.switchingToBeta) {
      final assetNotifier = ref.read(assetProvider.notifier);
      if (assetNotifier.mounted) {
        assetNotifier.dispose();
      }
      final albumNotifier = ref.read(albumProvider.notifier);
      if (albumNotifier.mounted) {
        albumNotifier.dispose();
      }

      // Cancel uploads
      await Store.put(StoreKey.backgroundBackup, false);
      ref
          .read(backupProvider.notifier)
          .configureBackgroundBackup(enabled: false, onBatteryInfo: () {}, onError: (_) {});
      ref.read(backupProvider.notifier).setAutoBackup(false);
      ref.read(backupProvider.notifier).cancelBackup();
      ref.read(manualUploadProvider.notifier).cancelBackup();
      // Start listening to new websocket events
      ref.read(websocketProvider.notifier).stopListenToOldEvents();
      ref.read(websocketProvider.notifier).startListeningToBetaEvents();

      final permission = await ref.read(galleryPermissionNotifier.notifier).requestGalleryPermission();

      if (permission.isGranted) {
        await ref.read(backgroundSyncProvider).syncLocal(full: true);
        await migrateDeviceAssetToSqlite(ref.read(isarProvider), ref.read(driftProvider));
        await migrateBackupAlbumsToSqlite(ref.read(isarProvider), ref.read(driftProvider));
      }
    } else {
      await ref.read(backgroundSyncProvider).cancel();
      ref.read(websocketProvider.notifier).stopListeningToBetaEvents();
      ref.read(websocketProvider.notifier).startListeningToOldEvents();
    }

    if (mounted) {
      setState(() {
        HapticFeedback.heavyImpact();
        hasMigrated = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: Durations.long4,
              child: hasMigrated
                  ? const Icon(Icons.check_circle_rounded, color: Colors.green, size: 48.0)
                  : const SizedBox(width: 50.0, height: 50.0, child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 16.0),
            Center(
              child: Column(
                children: [
                  SizedBox(
                    width: 300.0,
                    child: AnimatedSwitcher(
                      duration: Durations.long4,
                      child: hasMigrated
                          ? Text(
                              "Migration success!",
                              style: context.textTheme.titleMedium,
                              textAlign: TextAlign.center,
                            )
                          : Text(
                              "Data migration in progress...\nPlease wait and don't close this page",
                              style: context.textTheme.titleMedium,
                              textAlign: TextAlign.center,
                            ),
                    ),
                  ),
                  if (hasMigrated)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: ElevatedButton(
                        onPressed: () {
                          context.replaceRoute(
                            widget.switchingToBeta ? const TabShellRoute() : const TabControllerRoute(),
                          );
                        },
                        child: const Text("Continue"),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

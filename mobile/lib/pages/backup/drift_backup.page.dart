import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/backup/backup_toggle_button.widget.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/backup/backup_info_card.dart';
import 'package:logging/logging.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

@RoutePage()
class DriftBackupPage extends ConsumerStatefulWidget {
  const DriftBackupPage({super.key});

  @override
  ConsumerState<DriftBackupPage> createState() => _DriftBackupPageState();
}

class _DriftBackupPageState extends ConsumerState<DriftBackupPage> {
  bool? syncSuccess;

  @override
  void initState() {
    super.initState();

    WakelockPlus.enable();

    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) {
      return;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);

      ref.read(driftBackupProvider.notifier).updateSyncing(true);
      syncSuccess = await ref.read(backgroundSyncProvider).syncRemote();
      ref.read(driftBackupProvider.notifier).updateSyncing(false);

      if (mounted) {
        await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);
      }
    });
  }

  @override
  dispose() {
    super.dispose();
    WakelockPlus.disable();
  }

  @override
  Widget build(BuildContext context) {
    final selectedAlbum = ref
        .watch(backupAlbumProvider)
        .where((album) => album.backupSelection == BackupSelection.selected)
        .toList();

    final error = ref.watch(driftBackupProvider.select((p) => p.error));

    final backupNotifier = ref.read(driftBackupProvider.notifier);
    final backupSyncManager = ref.read(backgroundSyncProvider);

    Future<void> startBackup() async {
      final currentUser = Store.tryGet(StoreKey.currentUser);
      if (currentUser == null) {
        return;
      }

      if (syncSuccess == null) {
        ref.read(driftBackupProvider.notifier).updateSyncing(true);
        syncSuccess = await backupSyncManager.syncRemote();
        ref.read(driftBackupProvider.notifier).updateSyncing(false);
      }

      await backupNotifier.getBackupStatus(currentUser.id);

      if (syncSuccess == false) {
        Logger("DriftBackupPage").warning("Remote sync did not complete successfully, skipping backup");
        return;
      }
      await backupNotifier.startBackup(currentUser.id);
    }

    Future<void> stopBackup() async {
      await backupNotifier.cancel();
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text("backup_controller_page_backup".t()),
        leading: IconButton(
          onPressed: () {
            context.maybePop(true);
          },
          splashRadius: 24,
          icon: const Icon(Icons.arrow_back_ios_rounded),
        ),
        actions: [
          IconButton(
            onPressed: () {
              context.pushRoute(const DriftBackupOptionsRoute());
            },
            icon: const Icon(Icons.settings_outlined),
            tooltip: "backup_options".t(context: context),
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 32),
            child: ListView(
              children: [
                const SizedBox(height: 8),
                const _BackupAlbumSelectionCard(),
                if (selectedAlbum.isNotEmpty) ...[
                  const _TotalCard(),
                  const _BackupCard(),
                  const _RemainderCard(),
                  const Divider(),
                  BackupToggleButton(
                    onStart: () async => await startBackup(),
                    onStop: () async {
                      syncSuccess = null;
                      await stopBackup();
                    },
                  ),
                  switch (error) {
                    BackupError.none => const SizedBox.shrink(),
                    BackupError.syncFailed => Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Icon(Icons.warning_rounded, color: context.colorScheme.error, fill: 1),
                          const SizedBox(width: 8),
                          Text(
                            context.t.backup_error_sync_failed,
                            style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.error),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  },
                  TextButton.icon(
                    icon: const Icon(Icons.info_outline_rounded),
                    onPressed: () => context.pushRoute(const DriftUploadDetailRoute()),
                    label: Text("view_details".t(context: context)),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BackupAlbumSelectionCard extends ConsumerWidget {
  const _BackupAlbumSelectionCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget buildSelectedAlbumName() {
      String text = "backup_controller_page_backup_selected".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where((album) => album.backupSelection == BackupSelection.selected)
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (${'all'.tr()}), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: context.textTheme.labelLarge?.copyWith(color: context.primaryColor),
          ),
        );
      }
    }

    Widget buildExcludedAlbumName() {
      String text = "backup_controller_page_excluded".tr();
      final albums = ref
          .watch(backupAlbumProvider)
          .where((album) => album.backupSelection == BackupSelection.excluded)
          .toList();

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: context.textTheme.labelLarge?.copyWith(color: Colors.red[300]),
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: ListTile(
        minVerticalPadding: 18,
        title: Text("backup_controller_page_albums", style: context.textTheme.titleMedium).tr(),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "backup_controller_page_to_backup",
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ).tr(),
              buildSelectedAlbumName(),
              buildExcludedAlbumName(),
            ],
          ),
        ),
        trailing: ElevatedButton(
          onPressed: () async {
            await context.pushRoute(const DriftBackupAlbumSelectionRoute());
            final currentUser = ref.read(currentUserProvider);
            if (currentUser == null) {
              return;
            }
            unawaited(ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id));
          },
          child: const Text("select", style: TextStyle(fontWeight: FontWeight.bold)).tr(),
        ),
      ),
    );
  }
}

class _TotalCard extends ConsumerWidget {
  const _TotalCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalCount = ref.watch(driftBackupProvider.select((p) => p.totalCount));

    return BackupInfoCard(
      title: "total".tr(),
      subtitle: "backup_controller_page_total_sub".tr(),
      info: totalCount.toString(),
    );
  }
}

class _BackupCard extends ConsumerWidget {
  const _BackupCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final backupCount = ref.watch(driftBackupProvider.select((p) => p.backupCount));
    final syncStatus = ref.watch(syncStatusProvider);

    return BackupInfoCard(
      title: "backup_controller_page_backup".tr(),
      subtitle: "backup_controller_page_backup_sub".tr(),
      info: backupCount.toString(),
      isLoading: syncStatus.isRemoteSyncing,
    );
  }
}

class _RemainderCard extends ConsumerWidget {
  const _RemainderCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final remainderCount = ref.watch(driftBackupProvider.select((p) => p.remainderCount));
    final syncStatus = ref.watch(syncStatusProvider);

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: const BorderRadius.all(Radius.circular(20)),
        side: BorderSide(color: context.colorScheme.outlineVariant, width: 1),
      ),
      elevation: 0,
      borderOnForeground: false,
      child: Column(
        children: [
          ListTile(
            minVerticalPadding: 18,
            isThreeLine: true,
            title: Text("backup_controller_page_remainder".t(context: context), style: context.textTheme.titleMedium),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0, right: 18.0),
              child: Text(
                "backup_controller_page_remainder_sub".t(context: context),
                style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
              ),
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  children: [
                    Text(
                      remainderCount.toString(),
                      style: context.textTheme.titleLarge?.copyWith(
                        color: context.colorScheme.onSurface.withAlpha(syncStatus.isRemoteSyncing ? 50 : 255),
                      ),
                    ),
                    if (syncStatus.isRemoteSyncing)
                      Positioned.fill(
                        child: Align(
                          alignment: Alignment.center,
                          child: SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: context.colorScheme.onSurface.withAlpha(150),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                Text(
                  "backup_info_card_assets",
                  style: context.textTheme.labelLarge?.copyWith(
                    color: context.colorScheme.onSurface.withAlpha(syncStatus.isRemoteSyncing ? 50 : 255),
                  ),
                ).tr(),
              ],
            ),
          ),
          const Divider(height: 0),
          const _PreparingStatus(),
          const Divider(height: 0),

          ListTile(
            enableFeedback: true,
            visualDensity: VisualDensity.compact,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 0.0),
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
            ),
            onTap: () => context.pushRoute(const DriftBackupAssetDetailRoute()),
            title: Text(
              "view_details".t(context: context),
              style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
            ),
            trailing: Icon(Icons.arrow_forward_ios, size: 16, color: context.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }
}

class _PreparingStatus extends ConsumerStatefulWidget {
  const _PreparingStatus();

  @override
  _PreparingStatusState createState() => _PreparingStatusState();
}

class _PreparingStatusState extends ConsumerState {
  Timer? _pollingTimer;

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  void _startPollingIfNeeded() {
    if (_pollingTimer != null) return;

    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      final currentUser = ref.read(currentUserProvider);
      if (currentUser != null && mounted) {
        await ref.read(driftBackupProvider.notifier).getBackupStatus(currentUser.id);

        // Stop polling if processing count reaches 0
        final updatedProcessingCount = ref.read(driftBackupProvider.select((p) => p.processingCount));
        if (updatedProcessingCount == 0) {
          timer.cancel();
          _pollingTimer = null;
        }
      } else {
        timer.cancel();
        _pollingTimer = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final syncStatus = ref.watch(syncStatusProvider);
    final remainderCount = ref.watch(driftBackupProvider.select((p) => p.remainderCount));
    final processingCount = ref.watch(driftBackupProvider.select((p) => p.processingCount));
    final readyForUploadCount = remainderCount - processingCount;

    ref.listen<int>(driftBackupProvider.select((p) => p.processingCount), (previous, next) {
      if (next > 0 && _pollingTimer == null) {
        _startPollingIfNeeded();
      } else if (next == 0 && _pollingTimer != null) {
        _pollingTimer?.cancel();
        _pollingTimer = null;
      }
    });

    if (!syncStatus.isHashing) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(left: 1.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              decoration: BoxDecoration(
                color: context.colorScheme.surfaceContainerHigh.withValues(alpha: 0.5),
                shape: BoxShape.rectangle,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "preparing".t(context: context),
                        style: context.textTheme.labelLarge?.copyWith(
                          color: context.colorScheme.onSurface.withAlpha(200),
                        ),
                      ),
                      const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 1.5)),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    processingCount.toString(),
                    style: context.textTheme.titleMedium?.copyWith(
                      color: context.colorScheme.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
            decoration: BoxDecoration(color: context.colorScheme.primary.withValues(alpha: 0.1)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  "ready_for_upload".t(context: context),
                  style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface.withAlpha(200)),
                ),
                const SizedBox(height: 2),
                Text(
                  readyForUploadCount.toString(),
                  style: context.textTheme.titleMedium?.copyWith(
                    color: context.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

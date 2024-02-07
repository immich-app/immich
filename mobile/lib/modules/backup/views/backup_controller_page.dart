import 'dart:io';
import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/object_extensions.dart';
import 'package:immich_mobile/modules/album/providers/local_album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/backup/ui/current_backup_asset_info_box.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/modules/backup/ui/backup_info_card.dart';

@RoutePage()
class BackupControllerPage extends HookConsumerWidget {
  const BackupControllerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    final backupAlbums = ref.watch(backupAlbumsProvider);
    final hasAnyAlbum =
        backupAlbums.valueOrNull?.selectedBackupAlbums.isNotEmpty ?? false;

    bool hasExclusiveAccess =
        backupState.backupProgress != BackUpProgressEnum.inBackground;
    bool shouldBackup =
        backupState.allUniqueAssets.length - backupState.backedUpAssetsCount ==
                    0 ||
                !hasExclusiveAccess
            ? false
            : true;

    useEffect(
      () {
        if (backupState.backupProgress != BackUpProgressEnum.inProgress &&
            backupState.backupProgress != BackUpProgressEnum.manualInProgress) {
          ref.watch(backupProvider.notifier).getBackupInfo();
        }

        // Update the background settings information just to make sure we
        // have the latest, since the platform channel will not update
        // automatically
        if (Platform.isIOS) {
          ref.watch(iOSBackgroundSettingsProvider.notifier).refresh();
        }

        ref
            .watch(websocketProvider.notifier)
            .stopListenToEvent('on_upload_success');
        return null;
      },
      [],
    );

    Future<String> getSelectedAlbumNames() async {
      var text = "backup_controller_page_backup_selected".tr();
      final selectedAlbums =
          backupAlbums.valueOrNull?.selectedBackupAlbums ?? [];
      for (final selected in selectedAlbums) {
        await selected.album.load();
        final album = selected.album.value;
        if (album == null) {
          continue;
        }
        if (album.name == "Recent" || album.name == "Recents") {
          text += "${album.name} (${'backup_all'.tr()}), ";
        } else {
          text += "${album.name}, ";
        }
      }
      return text;
    }

    Widget buildSelectedAlbumName() {
      final selectedAlbums =
          backupAlbums.valueOrNull?.selectedBackupAlbums ?? [];

      if (selectedAlbums.isNotEmpty) {
        return FutureBuilder(
          future: getSelectedAlbumNames(),
          builder: (_, data) => data.hasData
              ? Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    data.data!.trim().substring(0, data.data!.length - 2),
                    style: context.textTheme.labelLarge?.copyWith(
                      color: context.primaryColor,
                    ),
                  ),
                )
              : const SizedBox.shrink(),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: context.textTheme.labelLarge?.copyWith(
              color: context.primaryColor,
            ),
          ),
        );
      }
    }

    Future<String> getExcludedAlbumNames() async {
      var text = "backup_controller_page_excluded".tr();
      final excludedAlbums =
          backupAlbums.valueOrNull?.excludedBackupAlbums ?? [];
      for (final excluded in excludedAlbums) {
        excluded.album.loadSync();
        final album = excluded.album.value;
        if (album == null) {
          continue;
        }
        text += "${album.name}, ";
      }
      return text;
    }

    Widget buildExcludedAlbumName() {
      final excludedAlbums =
          backupAlbums.valueOrNull?.excludedBackupAlbums ?? [];

      if (excludedAlbums.isNotEmpty) {
        return FutureBuilder(
          future: getExcludedAlbumNames(),
          builder: (_, data) => data.hasData
              ? Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: Text(
                    data.data!.trim().substring(0, data.data!.length - 2),
                    style: context.textTheme.labelLarge?.copyWith(
                      color: Colors.red[300],
                    ),
                  ),
                )
              : const SizedBox.shrink(),
        );
      } else {
        return const SizedBox();
      }
    }

    buildFolderSelectionTile() {
      return Padding(
        padding: const EdgeInsets.only(top: 8.0),
        child: Card(
          shape: RoundedRectangleBorder(
            borderRadius: const BorderRadius.all(Radius.circular(20)),
            side: BorderSide(
              color: context.isDarkTheme
                  ? const Color.fromARGB(255, 56, 56, 56)
                  : Colors.black12,
              width: 1,
            ),
          ),
          elevation: 0,
          borderOnForeground: false,
          child: ListTile(
            minVerticalPadding: 18,
            title: Text(
              "backup_controller_page_albums",
              style: context.textTheme.titleMedium,
            ).tr(),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "backup_controller_page_to_backup",
                    style: context.textTheme.bodyMedium,
                  ).tr(),
                  buildSelectedAlbumName(),
                  buildExcludedAlbumName(),
                ],
              ),
            ),
            trailing: ElevatedButton(
              onPressed: () =>
                  context.pushRoute(const BackupAlbumSelectionRoute()),
              child: const Text(
                "backup_controller_page_select",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ).tr(),
            ),
          ),
        ),
      );
    }

    void startBackup() {
      ref.watch(errorBackupListProvider.notifier).empty();
      if (ref.watch(backupProvider).backupProgress !=
          BackUpProgressEnum.inBackground) {
        ref.watch(backupProvider.notifier).startBackupProcess();
      }
    }

    Widget buildBackupButton() {
      return Padding(
        padding: const EdgeInsets.only(
          top: 24,
        ),
        child: Container(
          child: backupState.backupProgress == BackUpProgressEnum.inProgress ||
                  backupState.backupProgress ==
                      BackUpProgressEnum.manualInProgress
              ? ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    foregroundColor: Colors.grey[50],
                    backgroundColor: Colors.red[300],
                    // padding: const EdgeInsets.all(14),
                  ),
                  onPressed: () {
                    if (backupState.backupProgress ==
                        BackUpProgressEnum.manualInProgress) {
                      ref.read(manualUploadProvider.notifier).cancelBackup();
                    } else {
                      ref.read(backupProvider.notifier).cancelBackup();
                    }
                  },
                  child: const Text(
                    "backup_controller_page_cancel",
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ).tr(),
                )
              : ElevatedButton(
                  onPressed: shouldBackup ? startBackup : null,
                  child: const Text(
                    "backup_controller_page_start_backup",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ).tr(),
                ),
        ),
      );
    }

    buildBackgroundBackupInfo() {
      return const ListTile(
        leading: Icon(Icons.info_outline_rounded),
        title: Text(
          "Background backup is currently running, cannot start manual backup",
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "backup_controller_page_backup",
        ).tr(),
        leading: IconButton(
          onPressed: () {
            ref.watch(websocketProvider.notifier).listenUploadEvent();
            context.popRoute(true);
          },
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: IconButton(
              onPressed: () => context.pushRoute(const BackupOptionsRoute()),
              splashRadius: 24,
              icon: const Icon(
                Icons.settings_outlined,
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 32),
        child: ListView(
          // crossAxisAlignment: CrossAxisAlignment.start,
          children: hasAnyAlbum
              ? [
                  buildFolderSelectionTile(),
                  BackupInfoCard(
                    title: "backup_controller_page_total".tr(),
                    subtitle: "backup_controller_page_total_sub".tr(),
                    info:
                        ref.watch(localAlbumsProvider).valueOrNull.isNullOrEmpty
                            ? "..."
                            : "${backupState.allUniqueAssets.length}",
                  ),
                  BackupInfoCard(
                    title: "backup_controller_page_backup".tr(),
                    subtitle: "backup_controller_page_backup_sub".tr(),
                    info:
                        ref.watch(localAlbumsProvider).valueOrNull.isNullOrEmpty
                            ? "..."
                            : "${backupState.backedUpAssetsCount}",
                  ),
                  BackupInfoCard(
                    title: "backup_controller_page_remainder".tr(),
                    subtitle: "backup_controller_page_remainder_sub".tr(),
                    info: ref
                            .watch(localAlbumsProvider)
                            .valueOrNull
                            .isNullOrEmpty
                        ? "..."
                        : "${max(0, backupState.allUniqueAssets.length - backupState.backedUpAssetsCount)}",
                  ),
                  const Divider(),
                  const CurrentUploadingAssetInfoBox(),
                  if (!hasExclusiveAccess) buildBackgroundBackupInfo(),
                  buildBackupButton(),
                ]
              : [buildFolderSelectionTile()],
        ),
      ),
    );
  }
}

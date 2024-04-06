import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart' hide Store;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/modules/backup/ui/backup_main_info.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';

@RoutePage()
class BackupControllerPage extends HookConsumerWidget {
  const BackupControllerPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    final didGetBackupInfo = useState(false);
    bool hasExclusiveAccess =
        backupState.backupProgress != BackUpProgressEnum.inBackground;
    bool shouldBackup = backupState.allUniqueAssets.length -
                    backupState.selectedAlbumsBackupAssetsIds.length ==
                0 ||
            !hasExclusiveAccess
        ? false
        : true;
    bool fullyBackedUp = backupState.allUniqueAssets.length -
            backupState.selectedAlbumsBackupAssetsIds.length ==
        0;
    var inProgress = !{BackUpProgressEnum.done, BackUpProgressEnum.idle}
        .contains(backupState.backupProgress);
    var currentUser = Store.get(StoreKey.currentUser);

    useEffect(
      () {
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

    useEffect(
      () {
        if (backupState.backupProgress == BackUpProgressEnum.idle ||
            backupState.backupProgress == BackUpProgressEnum.done &&
                !didGetBackupInfo.value) {
          ref.watch(backupProvider.notifier).getBackupInfo().then(
            (value) {
              didGetBackupInfo.value = true;
            },
          );
        }
        return null;
      },
      [backupState.backupProgress],
    );

    Widget buildSelectedAlbumName() {
      var text = "backup_controller_page_backup_selected".tr();
      var albums = ref.watch(backupProvider).selectedBackupAlbums;

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (${'backup_all'.tr()}), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Text(
          text.trim().substring(0, text.length - 2),
          style: context.textTheme.labelLarge?.copyWith(
            color: context.primaryColor,
          ),
        );
      } else {
        return Text(
          "backup_controller_page_none_selected".tr(),
          style: context.textTheme.labelLarge?.copyWith(
            color: context.primaryColor,
          ),
        );
      }
    }

    Widget buildExcludedAlbumName() {
      var text = "backup_controller_page_excluded".tr();
      var albums = ref.watch(backupProvider).excludedBackupAlbums;

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Text(
          text.trim().substring(0, text.length - 2),
          style: context.textTheme.labelLarge?.copyWith(
            color: Colors.red[300],
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    selectAlbum() async {
      await context.pushRoute(const BackupAlbumSelectionRoute());
      // waited until returning from selection
      await ref.read(backupProvider.notifier).backupAlbumSelectionDone();
      // waited until backup albums are stored in DB
      ref.read(albumProvider.notifier).getDeviceAlbums();
    }

    void startBackup() {
      ref.watch(errorBackupListProvider.notifier).empty();
      if (ref.watch(backupProvider).backupProgress !=
          BackUpProgressEnum.inBackground) {
        ref.watch(backupProvider.notifier).startBackupProcess();
      }
    }

    Widget buildBackupButton() {
      const minimumSize = Size(200, 36);
      var shape = RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(15),
      );

      if (backupState.backupProgress == BackUpProgressEnum.inProgress ||
          backupState.backupProgress == BackUpProgressEnum.manualInProgress) {
        return ElevatedButton(
          style: ElevatedButton.styleFrom(
            foregroundColor: Colors.grey[50],
            backgroundColor: Colors.red[300],
            minimumSize: minimumSize,
            shape: shape,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
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
        );
      }

      if (backupState.backupProgress == BackUpProgressEnum.inBackground) {
        return OutlinedButton(
          onPressed: () => showDialog(
            context: context,
            builder: (context) => AlertDialog(
              content:
                  const Text("backup_controller_page_in_background_interact")
                      .tr(),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    "backup_controller_page_in_background_interact_ok",
                  ).tr(),
                ),
              ],
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: minimumSize,
            shape: shape,
            backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
            side: BorderSide(width: 1, color: context.primaryColor),
            foregroundColor: context.textTheme.bodyMedium?.color,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_upload,
                color: Colors.blue.shade400,
              ),
              const SizedBox(width: 8),
              const Text("backup_controller_page_in_background").tr(),
            ],
          ),
        );
      }

      if (!didGetBackupInfo.value) {
        return Container();
      }

      if (fullyBackedUp) {
        return Container(
          constraints: BoxConstraints(
            minHeight: minimumSize.height,
            minWidth: minimumSize.width,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(15),
            color: context.isDarkTheme ? Colors.black : Colors.white,
            border: Border.all(color: context.primaryColor),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.check_circle,
                color: Colors.green.shade400,
              ),
              const SizedBox(width: 8),
              const Text("backup_controller_page_backed_up").tr(),
            ],
          ),
        );
      }

      return ElevatedButton(
        onPressed: shouldBackup ? startBackup : null,
        style: ElevatedButton.styleFrom(
          minimumSize: minimumSize,
          shape: shape,
          disabledBackgroundColor:
              context.isDarkTheme ? Colors.grey[700] : Colors.grey[400],
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        child: const Text(
          "backup_controller_page_start_backup",
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
      );
    }

    // The default list tile has some overflow issues, causing the container to overflow exactly 16 pixels per list tile
    Widget buildCustomListTile({
      required Widget leading,
      required Widget title,
      Widget? subtitle,
    }) {
      return Padding(
        padding: const EdgeInsets.only(left: 24, right: 24, bottom: 16),
        child: Row(
          crossAxisAlignment: subtitle != null
              ? CrossAxisAlignment.start
              : CrossAxisAlignment.center,
          children: [
            leading,
            const SizedBox(width: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: subtitle != null ? [title, subtitle] : [title],
            ),
          ],
        ),
      );
    }

    Widget buildBackupAlbums() {
      return buildCustomListTile(
        leading: const Icon(Icons.cloud),
        title: Text(
          "backup_controller_page_albums",
          style: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: (didGetBackupInfo.value || inProgress)
              ? [
                  if (didGetBackupInfo.value) buildSelectedAlbumName(),
                  if (didGetBackupInfo.value) buildExcludedAlbumName(),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 32,
                    child: ElevatedButton(
                      onPressed: inProgress ? null : selectAlbum,
                      child: const Text(
                        "backup_controller_page_select",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                        ),
                      ).tr(),
                    ),
                  ),
                ]
              : [
                  const SizedBox(height: 10),
                  const CircularProgressIndicator(),
                ],
        ),
      );
    }

    Widget buildBackupQuota() {
      return buildCustomListTile(
        leading: const Icon(Icons.storage),
        title: Text(
          "backup_controller_page_quota_used",
          style: context.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ).tr(),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (currentUser.hasQuota)
              Padding(
                padding: const EdgeInsets.symmetric(
                  vertical: 8,
                ),
                child: SizedBox(
                  width: MediaQuery.of(context).size.width -
                      124, // this is a huge hack but I can't solve the overflow otherwise
                  child: LinearProgressIndicator(
                    value: currentUser.quotaUsageInBytes /
                        currentUser.quotaSizeInBytes,
                  ),
                ),
              ),
            Text(
              currentUser.hasQuota
                  ? "${(currentUser.quotaUsageInBytes / 1073741824).toStringAsFixed(1)}GB/${(currentUser.quotaSizeInBytes / 1073741824).toStringAsFixed(1)}GB"
                  : "${(currentUser.quotaUsageInBytes / 1073741824).toStringAsFixed(1)}GB",
            ),
          ],
        ),
      );
    }

    Widget buildAutomaticBackupDisabled() {
      return buildCustomListTile(
        // isThreeLine: true,
        leading: const Icon(Icons.info_outline),
        title: SizedBox(
          width: MediaQuery.of(context).size.width -
              124, // this is a huge hack but I can't solve the overflow otherwise
          child: Text(
            "backup_controller_page_automatic_backup_disabled",
            style: context.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ).tr(),
        ),
      );
    }

    return Scaffold(
      backgroundColor:
          context.isDarkTheme ? Colors.grey[900] : Colors.grey[200],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
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
                Icons.settings,
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16, right: 16),
        child: CustomScrollView(
          // crossAxisAlignment: CrossAxisAlignment.start,
          slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Column(
                children: [
                  BackupMainInfo(
                    backupState: backupState,
                    selectAlbum: selectAlbum,
                    loaded: didGetBackupInfo.value,
                    showError: () =>
                        context.pushRoute(const FailedBackupStatusRoute()),
                    inProgress: inProgress,
                    inBackground: backupState.backupProgress ==
                        BackUpProgressEnum.inBackground,
                  ),
                  Expanded(
                    child: Stack(
                      children: [
                        Positioned(
                          child: Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: Container(
                              decoration: BoxDecoration(
                                color: context.isDarkTheme
                                    ? Colors.black
                                    : Colors.white,
                                borderRadius: const BorderRadius.only(
                                  topLeft: Radius.circular(15),
                                  topRight: Radius.circular(15),
                                ),
                              ),
                              padding:
                                  const EdgeInsets.only(top: 36, bottom: 12),
                              child: Column(
                                children: [
                                  buildBackupAlbums(),
                                  buildBackupQuota(),
                                  if (!backupState.autoBackup &&
                                      !backupState.backgroundBackup)
                                    buildAutomaticBackupDisabled(),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            buildBackupButton(),
                          ],
                        ),
                      ],
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

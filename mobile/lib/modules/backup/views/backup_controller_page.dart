import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/modules/backup/ui/backup_info_card.dart';
import 'package:url_launcher/url_launcher.dart';

class BackupControllerPage extends HookConsumerWidget {
  const BackupControllerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    AuthenticationState authenticationState = ref.watch(authenticationProvider);
    bool hasExclusiveAccess =
        backupState.backupProgress != BackUpProgressEnum.inBackground;
    bool shouldBackup = backupState.allUniqueAssets.length -
                    backupState.selectedAlbumsBackupAssetsIds.length ==
                0 ||
            !hasExclusiveAccess
        ? false
        : true;

    useEffect(
      () {
        if (backupState.backupProgress != BackUpProgressEnum.inProgress) {
          ref.watch(backupProvider.notifier).getBackupInfo();
        }

        ref
            .watch(websocketProvider.notifier)
            .stopListenToEvent('on_upload_success');
        return null;
      },
      [],
    );

    Widget buildStorageInformation() {
      return ListTile(
        leading: Icon(
          Icons.storage_rounded,
          color: Theme.of(context).primaryColor,
        ),
        title: const Text(
          "backup_controller_page_server_storage",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ).tr(),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: LinearProgressIndicator(
                  minHeight: 10.0,
                  value: backupState.serverInfo.diskUsagePercentage / 100.0,
                  backgroundColor: Colors.grey,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: const Text('backup_controller_page_storage_format').tr(
                  args: [
                    backupState.serverInfo.diskUse,
                    backupState.serverInfo.diskSize
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    ListTile buildAutoBackupController() {
      var backUpOption = authenticationState.deviceInfo.isAutoBackup
          ? "backup_controller_page_status_on".tr()
          : "backup_controller_page_status_off".tr();
      var isAutoBackup = authenticationState.deviceInfo.isAutoBackup;
      var backupBtnText = authenticationState.deviceInfo.isAutoBackup
          ? "backup_controller_page_turn_off".tr()
          : "backup_controller_page_turn_on".tr();
      return ListTile(
        isThreeLine: true,
        leading: isAutoBackup
            ? Icon(
                Icons.cloud_done_rounded,
                color: Theme.of(context).primaryColor,
              )
            : const Icon(Icons.cloud_off_rounded),
        title: Text(
          backUpOption,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isAutoBackup)
                const Text(
                  "backup_controller_page_desc_backup",
                  style: TextStyle(fontSize: 14),
                ).tr(),
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: ElevatedButton(
                  onPressed: () {
                    if (isAutoBackup) {
                      ref
                          .read(authenticationProvider.notifier)
                          .setAutoBackup(false);
                    } else {
                      ref
                          .read(authenticationProvider.notifier)
                          .setAutoBackup(true);
                    }
                  },
                  child: Text(
                    backupBtnText,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              )
            ],
          ),
        ),
      );
    }

    void showErrorToUser(String msg) {
      final snackBar = SnackBar(
        content: Text(
          msg.tr(),
        ),
        backgroundColor: Colors.red,
      );
      ScaffoldMessenger.of(context).showSnackBar(snackBar);
    }

    void showBatteryOptimizationInfoToUser() {
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text(
              'backup_controller_page_background_battery_info_title',
            ).tr(),
            content: SingleChildScrollView(
              child: const Text(
                'backup_controller_page_background_battery_info_message',
              ).tr(),
            ),
            actions: [
              ElevatedButton(
                onPressed: () => launchUrl(
                  Uri.parse('https://dontkillmyapp.com'),
                  mode: LaunchMode.externalApplication,
                ),
                child: const Text(
                  "backup_controller_page_background_battery_info_link",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).tr(),
              ),
              ElevatedButton(
                child: const Text(
                  'backup_controller_page_background_battery_info_ok',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ).tr(),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              ),
            ],
          );
        },
      );
    }

    ListTile buildBackgroundBackupController() {
      final bool isBackgroundEnabled = backupState.backgroundBackup;
      final bool isWifiRequired = backupState.backupRequireWifi;
      final bool isChargingRequired = backupState.backupRequireCharging;
      final Color activeColor = Theme.of(context).primaryColor;
      return ListTile(
        isThreeLine: true,
        leading: isBackgroundEnabled
            ? Icon(
                Icons.cloud_sync_rounded,
                color: activeColor,
              )
            : const Icon(Icons.cloud_sync_rounded),
        title: Text(
          isBackgroundEnabled
              ? "backup_controller_page_background_is_on"
              : "backup_controller_page_background_is_off",
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ).tr(),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isBackgroundEnabled)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child:
                    const Text("backup_controller_page_background_description")
                        .tr(),
              ),
            if (isBackgroundEnabled)
              SwitchListTile(
                title:
                    const Text("backup_controller_page_background_wifi").tr(),
                secondary: Icon(
                  Icons.wifi,
                  color: isWifiRequired ? activeColor : null,
                ),
                dense: true,
                activeColor: activeColor,
                value: isWifiRequired,
                onChanged: hasExclusiveAccess
                    ? (isChecked) => ref
                        .read(backupProvider.notifier)
                        .configureBackgroundBackup(
                          requireWifi: isChecked,
                          onError: showErrorToUser,
                          onBatteryInfo: showBatteryOptimizationInfoToUser,
                        )
                    : null,
              ),
            if (isBackgroundEnabled)
              SwitchListTile(
                title: const Text("backup_controller_page_background_charging")
                    .tr(),
                secondary: Icon(
                  Icons.charging_station,
                  color: isChargingRequired ? activeColor : null,
                ),
                dense: true,
                activeColor: activeColor,
                value: isChargingRequired,
                onChanged: hasExclusiveAccess
                    ? (isChecked) => ref
                        .read(backupProvider.notifier)
                        .configureBackgroundBackup(
                          requireCharging: isChecked,
                          onError: showErrorToUser,
                          onBatteryInfo: showBatteryOptimizationInfoToUser,
                        )
                    : null,
              ),
            ElevatedButton(
              onPressed: () =>
                  ref.read(backupProvider.notifier).configureBackgroundBackup(
                        enabled: !isBackgroundEnabled,
                        onError: showErrorToUser,
                        onBatteryInfo: showBatteryOptimizationInfoToUser,
                      ),
              child: Text(
                isBackgroundEnabled
                    ? "backup_controller_page_background_turn_off"
                    : "backup_controller_page_background_turn_on",
                style:
                    const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ).tr(),
            ),
          ],
        ),
      );
    }

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

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "backup_controller_page_none_selected".tr(),
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
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

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: TextStyle(
              color: Colors.red[300],
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
      } else {
        return const SizedBox();
      }
    }

    buildFolderSelectionTile() {
      return Card(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(5), // if you need this
          side: const BorderSide(
            color: Colors.black12,
            width: 1,
          ),
        ),
        elevation: 0,
        borderOnForeground: false,
        child: ListTile(
          minVerticalPadding: 15,
          title: const Text(
            "backup_controller_page_albums",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
          ).tr(),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "backup_controller_page_to_backup",
                  style: TextStyle(fontSize: 12),
                ).tr(),
                buildSelectedAlbumName(),
                buildExcludedAlbumName()
              ],
            ),
          ),
          trailing: ElevatedButton(
            onPressed: hasExclusiveAccess
                ? () {
                    AutoRouter.of(context)
                        .push(const BackupAlbumSelectionRoute());
                  }
                : null,
            child: const Text(
              "backup_controller_page_select",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ).tr(),
          ),
        ),
      );
    }

    buildCurrentBackupAssetInfoCard() {
      return ListTile(
        leading: Icon(
          Icons.info_outline_rounded,
          color: Theme.of(context).primaryColor,
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "backup_controller_page_uploading_file_info",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ).tr(),
            if (ref.watch(errorBackupListProvider).isNotEmpty)
              ActionChip(
                avatar: Icon(
                  Icons.info,
                  color: Colors.red[400],
                ),
                elevation: 1,
                visualDensity: VisualDensity.compact,
                label: Text(
                  "backup_controller_page_failed",
                  style: TextStyle(
                    color: Colors.red[400],
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ).tr(
                  args: [ref.watch(errorBackupListProvider).length.toString()],
                ),
                backgroundColor: Colors.white,
                onPressed: () {
                  AutoRouter.of(context).push(const FailedBackupStatusRoute());
                },
              ),
          ],
        ),
        subtitle: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Row(
                children: [
                  Expanded(
                    child: LinearProgressIndicator(
                      minHeight: 10.0,
                      value: backupState.progressInPercentage / 100.0,
                      backgroundColor: Colors.grey,
                      color: Theme.of(context).primaryColor,
                    ),
                  ),
                  Text(
                    " ${backupState.progressInPercentage.toStringAsFixed(0)}%",
                    style: const TextStyle(fontSize: 12),
                  )
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Table(
                border: TableBorder.all(
                  color: Theme.of(context).primaryColorLight,
                  width: 1,
                ),
                children: [
                  TableRow(
                    decoration: const BoxDecoration(
                        // color: Colors.grey[100],
                        ),
                    children: [
                      TableCell(
                        verticalAlignment: TableCellVerticalAlignment.middle,
                        child: Padding(
                          padding: const EdgeInsets.all(6.0),
                          child: const Text(
                            'backup_controller_page_filename',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 10.0,
                            ),
                          ).tr(
                            args: [
                              backupState.currentUploadAsset.fileName,
                              backupState.currentUploadAsset.fileType
                                  .toLowerCase()
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  TableRow(
                    decoration: const BoxDecoration(
                        // color: Colors.grey[200],
                        ),
                    children: [
                      TableCell(
                        verticalAlignment: TableCellVerticalAlignment.middle,
                        child: Padding(
                          padding: const EdgeInsets.all(6.0),
                          child: const Text(
                            "backup_controller_page_created",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 10.0,
                            ),
                          ).tr(
                            args: [
                              DateFormat.yMMMMd('en_US').format(
                                DateTime.parse(
                                  backupState.currentUploadAsset.createdAt
                                      .toString(),
                                ).toLocal(),
                              )
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  TableRow(
                    decoration: const BoxDecoration(
                        // color: Colors.grey[100],
                        ),
                    children: [
                      TableCell(
                        child: Padding(
                          padding: const EdgeInsets.all(6.0),
                          child: const Text(
                            "backup_controller_page_id",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 10.0,
                            ),
                          ).tr(args: [backupState.currentUploadAsset.id]),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
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

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "backup_controller_page_backup",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ).tr(),
        leading: IconButton(
          onPressed: () {
            ref.watch(websocketProvider.notifier).listenUploadEvent();
            AutoRouter.of(context).pop(true);
          },
          splashRadius: 24,
          icon: const Icon(
            Icons.arrow_back_ios_rounded,
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.only(left: 16.0, right: 16, bottom: 32),
        child: ListView(
          // crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: const Text(
                "backup_controller_page_info",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ).tr(),
            ),
            hasExclusiveAccess
                ? const SizedBox.shrink()
                : Card(
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(5), // if you need this
                      side: const BorderSide(
                        color: Colors.black12,
                        width: 1,
                      ),
                    ),
                    elevation: 0,
                    borderOnForeground: false,
                    child: const Padding(
                      padding: EdgeInsets.all(16.0),
                      child: Text(
                        "Background backup is currently running, some actions are disabled",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
            buildFolderSelectionTile(),
            BackupInfoCard(
              title: "backup_controller_page_total".tr(),
              subtitle: "backup_controller_page_total_sub".tr(),
              info: "${backupState.allUniqueAssets.length}",
            ),
            BackupInfoCard(
              title: "backup_controller_page_backup".tr(),
              subtitle: "backup_controller_page_backup_sub".tr(),
              info: "${backupState.selectedAlbumsBackupAssetsIds.length}",
            ),
            BackupInfoCard(
              title: "backup_controller_page_remainder".tr(),
              subtitle: "backup_controller_page_remainder_sub".tr(),
              info:
                  "${backupState.allUniqueAssets.length - backupState.selectedAlbumsBackupAssetsIds.length}",
            ),
            const Divider(),
            buildAutoBackupController(),
            if (Platform.isAndroid) const Divider(),
            if (Platform.isAndroid) buildBackgroundBackupController(),
            const Divider(),
            buildStorageInformation(),
            const Divider(),
            buildCurrentBackupAssetInfoCard(),
            Padding(
              padding: const EdgeInsets.only(
                top: 24,
              ),
              child: Container(
                child:
                    backupState.backupProgress == BackUpProgressEnum.inProgress
                        ? ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              foregroundColor: Colors.grey[50],
                              backgroundColor: Colors.red[300],
                              // padding: const EdgeInsets.all(14),
                            ),
                            onPressed: () {
                              ref.read(backupProvider.notifier).cancelBackup();
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
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ).tr(),
                          ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

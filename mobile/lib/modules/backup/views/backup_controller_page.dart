import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/modules/backup/ui/backup_info_card.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';

class BackupControllerPage extends HookConsumerWidget {
  const BackupControllerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);
    AuthenticationState _authenticationState = ref.watch(authenticationProvider);
    bool shouldBackup =
        backupState.allUniqueAssets.length - backupState.selectedAlbumsBackupAssetsIds.length == 0 ? false : true;

    useEffect(() {
      if (backupState.backupProgress != BackUpProgressEnum.inProgress) {
        ref.read(backupProvider.notifier).getBackupInfo();
      }

      ref.watch(websocketProvider.notifier).stopListenToEvent('on_upload_success');
      return null;
    }, []);

    Widget _buildStorageInformation() {
      return ListTile(
        leading: Icon(
          Icons.storage_rounded,
          color: Theme.of(context).primaryColor,
        ),
        title: const Text(
          "Server Storage",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: LinearPercentIndicator(
                  padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 0),
                  barRadius: const Radius.circular(2),
                  lineHeight: 6.0,
                  percent: backupState.serverInfo.diskUsagePercentage / 100.0,
                  backgroundColor: Colors.grey,
                  progressColor: Theme.of(context).primaryColor,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text('${backupState.serverInfo.diskUse} of ${backupState.serverInfo.diskSize} used'),
              ),
            ],
          ),
        ),
      );
    }

    ListTile _buildBackupController() {
      var backUpOption = _authenticationState.deviceInfo.isAutoBackup ? "on" : "off";
      var isAutoBackup = _authenticationState.deviceInfo.isAutoBackup;
      var backupBtnText = _authenticationState.deviceInfo.isAutoBackup ? "off" : "on";
      return ListTile(
        isThreeLine: true,
        leading: isAutoBackup
            ? Icon(
                Icons.cloud_done_rounded,
                color: Theme.of(context).primaryColor,
              )
            : const Icon(Icons.cloud_off_rounded),
        title: Text(
          "Back up is $backUpOption",
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              !isAutoBackup
                  ? const Text(
                      "Turn on backup to automatically upload new assets to the server.",
                      style: TextStyle(fontSize: 14),
                    )
                  : Container(),
              Padding(
                padding: const EdgeInsets.only(top: 8.0),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(
                      width: 1,
                      color: Color.fromARGB(255, 220, 220, 220),
                    ),
                  ),
                  onPressed: () {
                    isAutoBackup
                        ? ref.watch(authenticationProvider.notifier).setAutoBackup(false)
                        : ref.watch(authenticationProvider.notifier).setAutoBackup(true);
                  },
                  child: Text("Turn $backupBtnText Backup", style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              )
            ],
          ),
        ),
      );
    }

    Widget _buildSelectedAlbumName() {
      var text = "Selected: ";
      var albums = ref.watch(backupProvider).selectedBackupAlbums;

      if (albums.isNotEmpty) {
        for (var album in albums) {
          if (album.name == "Recent" || album.name == "Recents") {
            text += "${album.name} (All), ";
          } else {
            text += "${album.name}, ";
          }
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: TextStyle(color: Theme.of(context).primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        );
      } else {
        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            "None selected",
            style: TextStyle(color: Theme.of(context).primaryColor, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        );
      }
    }

    Widget _buildExcludedAlbumName() {
      var text = "Excluded: ";
      var albums = ref.watch(backupProvider).excludedBackupAlbums;

      if (albums.isNotEmpty) {
        for (var album in albums) {
          text += "${album.name}, ";
        }

        return Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            text.trim().substring(0, text.length - 2),
            style: TextStyle(color: Colors.red[300], fontSize: 12, fontWeight: FontWeight.bold),
          ),
        );
      } else {
        return Container();
      }
    }

    _buildFolderSelectionTile() {
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
          title: const Text("Backup Albums", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Albums to be backup",
                  style: TextStyle(color: Color(0xFF808080), fontSize: 12),
                ),
                _buildSelectedAlbumName(),
                _buildExcludedAlbumName()
              ],
            ),
          ),
          trailing: OutlinedButton(
            style: OutlinedButton.styleFrom(
              enableFeedback: true,
              side: const BorderSide(
                width: 1,
                color: Color.fromARGB(255, 220, 220, 220),
              ),
            ),
            onPressed: () {
              AutoRouter.of(context).push(const BackupAlbumSelectionRoute());
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(
                vertical: 16.0,
              ),
              child: Text(
                "Select",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Text(
          "Backup",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
            onPressed: () {
              ref.watch(websocketProvider.notifier).listenUploadEvent();
              AutoRouter.of(context).pop(true);
            },
            splashRadius: 24,
            icon: const Icon(
              Icons.arrow_back_ios_rounded,
            )),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: ListView(
          // crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: Text(
                "Backup Information",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            _buildFolderSelectionTile(),
            BackupInfoCard(
              title: "Total",
              subtitle: "All unique photos and videos from selected albums",
              info: "${backupState.allUniqueAssets.length}",
            ),
            BackupInfoCard(
              title: "Backup",
              subtitle: "Photos and videos from selected albums that are backup",
              info: "${backupState.selectedAlbumsBackupAssetsIds.length}",
            ),
            BackupInfoCard(
              title: "Remainder",
              subtitle: "Photos and videos that has not been backing up from selected albums",
              info: "${backupState.allUniqueAssets.length - backupState.selectedAlbumsBackupAssetsIds.length}",
            ),
            const Divider(),
            _buildBackupController(),
            const Divider(),
            _buildStorageInformation(),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(
                  "Asset that were being backup: ${backupState.allUniqueAssets.length - backupState.selectedAlbumsBackupAssetsIds.length} [${backupState.progressInPercentage.toStringAsFixed(0)}%]"),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 8.0),
              child: Row(children: [
                const Text("Backup Progress:"),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 2)),
                backupState.backupProgress == BackUpProgressEnum.inProgress
                    ? const CircularProgressIndicator.adaptive()
                    : const Text("Done"),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Container(
                child: backupState.backupProgress == BackUpProgressEnum.inProgress
                    ? ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          primary: Colors.red[300],
                          onPrimary: Colors.grey[50],
                        ),
                        onPressed: () {
                          ref.read(backupProvider.notifier).cancelBackup();
                        },
                        child: const Text("Cancel"),
                      )
                    : ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          primary: Theme.of(context).primaryColor,
                          onPrimary: Colors.grey[50],
                        ),
                        onPressed: shouldBackup
                            ? () {
                                ref.read(backupProvider.notifier).startBackupProcess();
                              }
                            : null,
                        child: const Text("Start Backup"),
                      ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

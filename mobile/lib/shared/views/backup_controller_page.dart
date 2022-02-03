import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/login/models/authentication_state.model.dart';
import 'package:immich_mobile/shared/models/backup_state.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';

class BackupControllerPage extends HookConsumerWidget {
  const BackupControllerPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState _backupState = ref.watch(backupProvider);
    AuthenticationState _authenticationState = ref.watch(authenticationProvider);

    bool shouldBackup = _backupState.totalAssetCount - _backupState.assetOnDatabase == 0 ? false : true;

    useEffect(() {
      if (_backupState.backupProgress != BackUpProgressEnum.inProgress) {
        ref.read(backupProvider.notifier).getBackupInfo();
      }
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
              LinearPercentIndicator(
                padding: const EdgeInsets.only(top: 8.0),
                lineHeight: 5.0,
                percent: _backupState.serverInfo.diskUsagePercentage / 100.0,
                backgroundColor: Colors.grey,
                progressColor: Theme.of(context).primaryColor,
              ),
              Padding(
                padding: const EdgeInsets.only(top: 12.0),
                child: Text('${_backupState.serverInfo.diskUse} of ${_backupState.serverInfo.diskSize} used'),
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
              OutlinedButton(
                onPressed: () {
                  isAutoBackup
                      ? ref.watch(authenticationProvider.notifier).setAutoBackup(false)
                      : ref.watch(authenticationProvider.notifier).setAutoBackup(true);
                },
                child: Text("Turn $backupBtnText Backup"),
              )
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Backup",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        leading: IconButton(
            onPressed: () {
              AutoRouter.of(context).pop(true);
            },
            icon: const Icon(Icons.arrow_back_ios_rounded)),
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
            BackupInfoCard(
              title: "Total",
              subtitle: "All images and video on the device",
              info: "${_backupState.totalAssetCount}",
            ),
            BackupInfoCard(
              title: "Backup",
              subtitle: "Images and videos of the device that are backup on server",
              info: "${_backupState.assetOnDatabase}",
            ),
            BackupInfoCard(
              title: "Remainder",
              subtitle: "Images and videos that has not been backing up",
              info: "${_backupState.totalAssetCount - _backupState.assetOnDatabase}",
            ),
            const Divider(),
            _buildBackupController(),
            const Divider(),
            _buildStorageInformation(),
            const Divider(),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(
                  "Asset that were being backup: ${_backupState.backingUpAssetCount} [${_backupState.progressInPercentage.toStringAsFixed(0)}%]"),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 8.0),
              child: Row(children: [
                const Text("Backup Progress:"),
                const Padding(padding: EdgeInsets.symmetric(horizontal: 2)),
                _backupState.backupProgress == BackUpProgressEnum.inProgress
                    ? const CircularProgressIndicator.adaptive()
                    : const Text("Done"),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Container(
                child: _backupState.backupProgress == BackUpProgressEnum.inProgress
                    ? ElevatedButton(
                        style: ElevatedButton.styleFrom(primary: Colors.red[300]),
                        onPressed: () {
                          ref.read(backupProvider.notifier).cancelBackup();
                        },
                        child: const Text("Cancel"),
                      )
                    : ElevatedButton(
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

class BackupInfoCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String info;
  const BackupInfoCard({Key? key, required this.title, required this.subtitle, required this.info}) : super(key: key);

  @override
  Widget build(BuildContext context) {
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
        isThreeLine: true,
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: Text(
            subtitle,
            style: const TextStyle(color: Color(0xFF808080), fontSize: 12),
          ),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              info,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const Text("assets"),
          ],
        ),
      ),
    );
  }
}

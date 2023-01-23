import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class CurrentUploadingAssetInfoBox extends HookConsumerWidget {
  const CurrentUploadingAssetInfoBox({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BackUpState backupState = ref.watch(backupProvider);

    String getAssetCreationDate() {
      return DateFormat.yMMMMd('en_US').format(
        DateTime.parse(
          backupState.currentUploadAsset.createdAt.toString(),
        ).toLocal(),
      );
    }

    Widget buildErrorChip() {
      return ActionChip(
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
      );
    }

    Widget buildAssetInfoTable() {
      return Table(
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
                      backupState.currentUploadAsset.fileType.toLowerCase()
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
                    args: [getAssetCreationDate()],
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
      );
    }

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
          if (ref.watch(errorBackupListProvider).isNotEmpty) buildErrorChip(),
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
            child: buildAssetInfoTable(),
          ),
        ],
      ),
    );
  }
}

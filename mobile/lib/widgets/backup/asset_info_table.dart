import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';

class BackupAssetInfoTable extends ConsumerWidget {
  const BackupAssetInfoTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isManualUpload = ref.watch(
      backupProvider.select(
        (value) => value.backupProgress == BackUpProgressEnum.manualInProgress,
      ),
    );

    final isUploadInProgress = ref.watch(
      backupProvider.select(
        (value) =>
            value.backupProgress == BackUpProgressEnum.inProgress ||
            value.backupProgress == BackUpProgressEnum.inBackground ||
            value.backupProgress == BackUpProgressEnum.manualInProgress,
      ),
    );

    final asset = isManualUpload
        ? ref.watch(
            manualUploadProvider.select((value) => value.currentUploadAsset),
          )
        : ref.watch(backupProvider.select((value) => value.currentUploadAsset));

    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Table(
        border: TableBorder.all(
          color: context.colorScheme.outlineVariant,
          width: 1,
        ),
        children: [
          TableRow(
            children: [
              TableCell(
                verticalAlignment: TableCellVerticalAlignment.middle,
                child: Padding(
                  padding: const EdgeInsets.all(6.0),
                  child: Text(
                    'backup_controller_page_filename',
                    style: TextStyle(
                      color: context.colorScheme.onSurfaceSecondary,
                      fontWeight: FontWeight.bold,
                      fontSize: 10.0,
                    ),
                  ).tr(
                    namedArgs: isUploadInProgress
                        ? {
                            'filename': asset.fileName,
                            'size': asset.fileType.toLowerCase(),
                          }
                        : {'filename': "-", 'size': "-"},
                  ),
                ),
              ),
            ],
          ),
          TableRow(
            children: [
              TableCell(
                verticalAlignment: TableCellVerticalAlignment.middle,
                child: Padding(
                  padding: const EdgeInsets.all(6.0),
                  child: Text(
                    "backup_controller_page_created",
                    style: TextStyle(
                      color: context.colorScheme.onSurfaceSecondary,
                      fontWeight: FontWeight.bold,
                      fontSize: 10.0,
                    ),
                  ).tr(
                    namedArgs: {
                      'date': isUploadInProgress
                          ? _getAssetCreationDate(asset)
                          : "-",
                    },
                  ),
                ),
              ),
            ],
          ),
          TableRow(
            children: [
              TableCell(
                child: Padding(
                  padding: const EdgeInsets.all(6.0),
                  child: Text(
                    "backup_controller_page_id",
                    style: TextStyle(
                      color: context.colorScheme.onSurfaceSecondary,
                      fontWeight: FontWeight.bold,
                      fontSize: 10.0,
                    ),
                  ).tr(
                    namedArgs: {'id': isUploadInProgress ? asset.id : "-"},
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @pragma('vm:prefer-inline')
  String _getAssetCreationDate(CurrentUploadAsset asset) {
    return DateFormat.yMMMMd().format(asset.fileCreatedAt.toLocal());
  }
}

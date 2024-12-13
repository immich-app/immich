import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';

class BackupUploadStats extends ConsumerWidget {
  const BackupUploadStats({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isManualUpload = ref.watch(
      backupProvider.select(
        (value) => value.backupProgress == BackUpProgressEnum.manualInProgress,
      ),
    );

    final uploadFileProgress = isManualUpload
        ? ref.watch(
            manualUploadProvider.select((value) => value.progressInFileSize),
          )
        : ref.watch(backupProvider.select((value) => value.progressInFileSize));

    final uploadFileSpeed = isManualUpload
        ? ref.watch(
            manualUploadProvider.select((value) => value.progressInFileSpeed),
          )
        : ref.watch(
            backupProvider.select((value) => value.progressInFileSpeed),
          );

    return Padding(
      padding: const EdgeInsets.only(top: 2.0, bottom: 2.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            uploadFileProgress,
            style: const TextStyle(fontSize: 10, fontFamily: "OverpassMono"),
          ),
          Text(
            _formatUploadFileSpeed(uploadFileSpeed),
            style: const TextStyle(fontSize: 10, fontFamily: "OverpassMono"),
          ),
        ],
      ),
    );
  }

  @pragma('vm:prefer-inline')
  String _formatUploadFileSpeed(double uploadFileSpeed) {
    if (uploadFileSpeed < 1024) {
      return '${uploadFileSpeed.toStringAsFixed(2)} B/s';
    } else if (uploadFileSpeed < 1024 * 1024) {
      return '${(uploadFileSpeed / 1024).toStringAsFixed(2)} KB/s';
    } else if (uploadFileSpeed < 1024 * 1024 * 1024) {
      return '${(uploadFileSpeed / (1024 * 1024)).toStringAsFixed(2)} MB/s';
    } else {
      return '${(uploadFileSpeed / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB/s';
    }
  }
}

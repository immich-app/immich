import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';

class BackupUploadProgressBar extends ConsumerWidget {
  const BackupUploadProgressBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isManualUpload = ref.watch(
      backupProvider.select(
        (value) => value.backupProgress == BackUpProgressEnum.manualInProgress,
      ),
    );

    final isIcloudAsset = isManualUpload
        ? ref.watch(
            manualUploadProvider
                .select((value) => value.currentUploadAsset.isIcloudAsset),
          )
        : ref.watch(
            backupProvider
                .select((value) => value.currentUploadAsset.isIcloudAsset),
          );

    final uploadProgress = isManualUpload
        ? ref.watch(
            manualUploadProvider.select((value) => value.progressInPercentage),
          )
        : ref.watch(
            backupProvider.select((value) => value.progressInPercentage),
          );

    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Row(
        children: [
          if (isIcloudAsset)
            SizedBox(
              width: 110,
              child: Text(
                "Immich Upload",
                style: context.textTheme.labelSmall,
              ),
            ),
          Expanded(
            child: LinearProgressIndicator(
              minHeight: 10.0,
              value: uploadProgress / 100.0,
              borderRadius: const BorderRadius.all(Radius.circular(10.0)),
            ),
          ),
          Text(
            " ${uploadProgress.toStringAsFixed(0)}%",
            style: const TextStyle(fontSize: 12, fontFamily: "OverpassMono"),
          ),
        ],
      ),
    );
  }
}

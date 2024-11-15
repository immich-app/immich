import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';

class IcloudDownloadProgressBar extends ConsumerWidget {
  const IcloudDownloadProgressBar({super.key});
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

    if (!isIcloudAsset) {
      return const SizedBox();
    }

    final iCloudDownloadProgress = ref
        .watch(backupProvider.select((value) => value.iCloudDownloadProgress));

    return Padding(
      padding: const EdgeInsets.only(top: 8.0),
      child: Row(
        children: [
          SizedBox(
            width: 110,
            child: Text(
              "iCloud Download",
              style: context.textTheme.labelSmall,
            ),
          ),
          Expanded(
            child: LinearProgressIndicator(
              minHeight: 10.0,
              value: iCloudDownloadProgress / 100.0,
              borderRadius: const BorderRadius.all(Radius.circular(10.0)),
            ),
          ),
          Text(
            " ${iCloudDownloadProgress ~/ 1}%",
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

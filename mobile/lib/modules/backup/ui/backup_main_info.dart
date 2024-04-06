import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:immich_mobile/modules/backup/models/backup_state.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/error_backup_list.provider.dart';
import 'package:immich_mobile/modules/backup/providers/manual_upload.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class BackupMainInfo extends HookConsumerWidget {
  final BackUpState backupState;
  final VoidCallback selectAlbum;
  final VoidCallback showError;
  final bool loaded;
  final bool inProgress;
  final bool inBackground;

  const BackupMainInfo({
    super.key,
    required this.backupState,
    required this.selectAlbum,
    required this.showError,
    required this.loaded,
    required this.inProgress,
    required this.inBackground,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var hasAnyAlbum = backupState.selectedBackupAlbums.isNotEmpty;

    Widget buildErrorChip() {
      return Padding(
        padding: const EdgeInsets.only(top: 12),
        child: ActionChip(
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
          onPressed: () => context.pushRoute(const FailedBackupStatusRoute()),
        ),
      );
    }

    Widget buildProgress() {
      String formatUploadFileSpeed(double uploadFileSpeed) {
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

      var isManualUpload = ref.watch(backupProvider).backupProgress ==
          BackUpProgressEnum.manualInProgress;
      var asset = !isManualUpload
          ? ref.watch(backupProvider).currentUploadAsset
          : ref.watch(manualUploadProvider).currentUploadAsset;
      var uploadProgress = !isManualUpload
          ? ref.watch(backupProvider).progressInPercentage
          : ref.watch(manualUploadProvider).progressInPercentage;
      var uploadFileProgress = !isManualUpload
          ? ref.watch(backupProvider).progressInFileSize
          : ref.watch(manualUploadProvider).progressInFileSize;
      var uploadFileSpeed = !isManualUpload
          ? ref.watch(backupProvider).progressInFileSpeed
          : ref.watch(manualUploadProvider).progressInFileSpeed;
      var iCloudDownloadProgress =
          ref.watch(backupProvider).iCloudDownloadProgress;

      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [
            ...(asset.iCloudAsset != null && asset.iCloudAsset!
                ? [
                    Row(
                      children: [
                        const Text(
                          "backup_controller_page_icloud_download",
                        ).tr(),
                        const Spacer(),
                        Text("${iCloudDownloadProgress.toStringAsFixed(0)}%"),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: iCloudDownloadProgress / 100,
                    ),
                  ]
                : []),
            Row(
              children: [
                Text(
                  (asset.iCloudAsset != null && asset.iCloudAsset!)
                      ? "backup_controller_page_immich_upload"
                          .tr(args: [formatUploadFileSpeed(uploadFileSpeed)])
                      : "$uploadFileProgress (${formatUploadFileSpeed(uploadFileSpeed)})",
                ),
                const Spacer(),
                Text("${uploadProgress.toStringAsFixed(0)}%"),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: uploadProgress / 100,
            ),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.all(Radius.circular(15)),
                color: context.scaffoldBackgroundColor,
              ),
              padding: const EdgeInsets.all(12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      asset.fileName,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat.yMMMMd().format(
                      DateTime.parse(
                        asset.fileCreatedAt.toString(),
                      ).toLocal(),
                    ),
                    style: context.textTheme.bodyMedium?.copyWith(
                      color: context.textTheme.bodyMedium?.color
                          ?.withOpacity(0.75),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "ID: ${asset.id}",
              style: context.textTheme.bodySmall?.copyWith(
                color: context.textTheme.bodySmall?.color?.withOpacity(0.75),
              ),
            ),
          ],
        ),
      );
    }

    List<Widget> buildContent() {
      if (!loaded) {
        return [const CircularProgressIndicator()];
      }

      if (!hasAnyAlbum) {
        return [
          Text(
            "backup_controller_page_no_albums_selected_header",
            style: context.textTheme.titleLarge,
            textAlign: TextAlign.center,
          ).tr(),
          const Text(
            "backup_controller_page_no_albums_selected_body",
            textAlign: TextAlign.center,
          ).tr(),
          const SizedBox(height: 28),
          ElevatedButton(
            onPressed: selectAlbum,
            child: const Text(
              "backup_controller_page_select",
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ).tr(),
          ),
        ];
      }

      return [
        Text(
          "${backupState.selectedAlbumsBackupAssetsIds.length}/${backupState.allUniqueAssets.length}",
          style: context.textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        const Text(
          "backup_controller_page_asset_backed_up",
        ).tr(),
        const SizedBox(height: 28),
        inProgress
            ? buildProgress()
            : Text(
                backupState.lastBackupTimestamp == null
                    ? "backup_controller_page_never_backed_up".tr()
                    : backupState.lastBackupTimestamp!.timeAgo(),
                style: context.textTheme.bodyMedium?.copyWith(
                  color: context.textTheme.bodyMedium?.color?.withOpacity(0.75),
                ),
              ),
        if (ref.watch(errorBackupListProvider).isNotEmpty) buildErrorChip(),
      ];
    }

    return AnimatedSize(
      duration: const Duration(milliseconds: 200),
      curve: Easing.standard,
      alignment: Alignment.topCenter,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
        child: Column(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.end,
              children: buildContent(),
            ),
          ],
        ),
      ),
    );
  }
}

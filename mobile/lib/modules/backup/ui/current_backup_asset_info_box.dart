import 'dart:io';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/backup/error_backup_list.provider.dart';
import 'package:immich_mobile/providers/backup/manual_upload.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:photo_manager/photo_manager.dart';

class CurrentUploadingAssetInfoBox extends HookConsumerWidget {
  const CurrentUploadingAssetInfoBox({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
    final isShowThumbnail = useState(false);

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

    String getAssetCreationDate() {
      return DateFormat.yMMMMd().format(
        DateTime.parse(
          asset.fileCreatedAt.toString(),
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
        onPressed: () => context.pushRoute(const FailedBackupStatusRoute()),
      );
    }

    Widget buildAssetInfoTable() {
      return Table(
        border: TableBorder.all(
          color: context.themeData.primaryColorLight,
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
                    args: [asset.fileName, asset.fileType.toLowerCase()],
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
                  ).tr(args: [asset.id]),
                ),
              ),
            ],
          ),
        ],
      );
    }

    buildAssetThumbnail() async {
      var assetEntity = await AssetEntity.fromId(asset.id);

      if (assetEntity != null) {
        return assetEntity.thumbnailDataWithSize(
          const ThumbnailSize(500, 500),
          quality: 100,
        );
      }
    }

    buildiCloudDownloadProgerssBar() {
      if (asset.iCloudAsset != null && asset.iCloudAsset!) {
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
                  value: uploadProgress / 100.0,
                  backgroundColor: Colors.grey,
                  color: context.primaryColor,
                ),
              ),
              Text(
                " ${iCloudDownloadProgress.toStringAsFixed(0)}%",
                style: const TextStyle(fontSize: 12),
              ),
            ],
          ),
        );
      }

      return const SizedBox();
    }

    buildUploadProgressBar() {
      return Padding(
        padding: const EdgeInsets.only(top: 8.0),
        child: Row(
          children: [
            if (asset.iCloudAsset != null && asset.iCloudAsset!)
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
                backgroundColor: Colors.grey,
                color: context.primaryColor,
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

    buildUploadStats() {
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
              formatUploadFileSpeed(uploadFileSpeed),
              style: const TextStyle(fontSize: 10, fontFamily: "OverpassMono"),
            ),
          ],
        ),
      );
    }

    return FutureBuilder<Uint8List?>(
      future: buildAssetThumbnail(),
      builder: (context, thumbnail) => ListTile(
        isThreeLine: true,
        leading: AnimatedCrossFade(
          alignment: Alignment.centerLeft,
          firstChild: GestureDetector(
            onTap: () => isShowThumbnail.value = false,
            child: thumbnail.hasData
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(5),
                    child: Image.memory(
                      thumbnail.data!,
                      fit: BoxFit.cover,
                      width: 50,
                      height: 50,
                    ),
                  )
                : const SizedBox(
                    width: 50,
                    height: 50,
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: CircularProgressIndicator.adaptive(
                        strokeWidth: 1,
                      ),
                    ),
                  ),
          ),
          secondChild: GestureDetector(
            onTap: () => isShowThumbnail.value = true,
            child: Icon(
              Icons.image_outlined,
              color: context.primaryColor,
              size: 30,
            ),
          ),
          crossFadeState: isShowThumbnail.value
              ? CrossFadeState.showFirst
              : CrossFadeState.showSecond,
          duration: const Duration(milliseconds: 200),
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "backup_controller_page_uploading_file_info",
              style: context.textTheme.titleSmall,
            ).tr(),
            if (ref.watch(errorBackupListProvider).isNotEmpty) buildErrorChip(),
          ],
        ),
        subtitle: Column(
          children: [
            if (Platform.isIOS) buildiCloudDownloadProgerssBar(),
            buildUploadProgressBar(),
            buildUploadStats(),
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: buildAssetInfoTable(),
            ),
          ],
        ),
      ),
    );
  }
}

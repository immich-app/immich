import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/backup/asset_info_table.dart';
import 'package:immich_mobile/widgets/backup/error_chip.dart';
import 'package:immich_mobile/widgets/backup/icloud_download_progress_bar.dart';
import 'package:immich_mobile/widgets/backup/upload_progress_bar.dart';
import 'package:immich_mobile/widgets/backup/upload_stats.dart';

class CurrentUploadingAssetInfoBox extends StatelessWidget {
  const CurrentUploadingAssetInfoBox({super.key});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      isThreeLine: true,
      leading: Icon(
        Icons.image_outlined,
        color: context.primaryColor,
        size: 30,
      ),
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "backup_controller_page_uploading_file_info",
            style: context.textTheme.titleSmall,
          ).tr(),
          const BackupErrorChip(),
        ],
      ),
      subtitle: Column(
        children: [
          if (Platform.isIOS) const IcloudDownloadProgressBar(),
          const BackupUploadProgressBar(),
          const BackupUploadStats(),
          const BackupAssetInfoTable(),
        ],
      ),
    );
  }
}

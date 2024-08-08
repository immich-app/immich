import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/file_info.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/camera_info.dart';

class AssetDetails extends StatelessWidget {
  final Asset asset;
  final ExifInfo? exifInfo;

  const AssetDetails({
    super.key,
    required this.asset,
    this.exifInfo,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "exif_bottom_sheet_details",
            style: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(200),
              fontWeight: FontWeight.w600,
            ),
          ).tr(),
          FileInfo(asset: asset),
          if (exifInfo?.make != null) CameraInfo(exifInfo: exifInfo!),
        ],
      ),
    );
  }
}

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_sheet/exif_image_properties.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';

class ExifDetail extends StatelessWidget {
  final Asset asset;
  final ExifInfo? exifInfo;

  const ExifDetail({
    super.key,
    required this.asset,
    this.exifInfo,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: Text(
            "exif_bottom_sheet_details",
            style: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(200),
              fontWeight: FontWeight.w600,
            ),
          ).tr(),
        ),
        ExifImageProperties(asset: asset),
        if (exifInfo?.make != null)
          ListTile(
            contentPadding: const EdgeInsets.all(0),
            dense: true,
            leading: Icon(
              Icons.camera,
              color: textColor.withAlpha(200),
            ),
            title: Text(
              "${exifInfo?.make} ${exifInfo?.model}",
              style: context.textTheme.labelLarge,
            ),
            subtitle: exifInfo?.f != null ||
                    exifInfo?.exposureSeconds != null ||
                    exifInfo?.mm != null ||
                    exifInfo?.iso != null
                ? Text(
                    "ƒ/${exifInfo?.fNumber}   ${exifInfo?.exposureTime}   ${exifInfo?.focalLength} mm   ISO ${exifInfo?.iso ?? ''} ",
                    style: context.textTheme.bodySmall,
                  )
                : null,
          ),
      ],
    );
  }
}

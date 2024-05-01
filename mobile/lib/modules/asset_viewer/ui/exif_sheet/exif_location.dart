import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_sheet/exif_map.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';

class ExifLocation extends StatelessWidget {
  final Asset asset;
  final ExifInfo? exifInfo;
  final void Function() editLocation;
  final String formattedDateTime;

  const ExifLocation({
    super.key,
    required this.asset,
    required this.exifInfo,
    required this.editLocation,
    required this.formattedDateTime,
  });

  @override
  Widget build(BuildContext context) {
    final hasCoordinates = exifInfo?.hasCoordinates ?? false;
    // Guard no lat/lng
    if (!hasCoordinates) {
      return asset.isRemote && !asset.isReadOnly
          ? ListTile(
              minLeadingWidth: 0,
              contentPadding: const EdgeInsets.all(0),
              leading: const Icon(Icons.location_on),
              title: Text(
                "exif_bottom_sheet_location_add",
                style: context.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: context.primaryColor,
                ),
              ).tr(),
              onTap: editLocation,
            )
          : const SizedBox.shrink();
    }

    return Column(
      children: [
        // Location
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "exif_bottom_sheet_location",
                  style: context.textTheme.labelMedium?.copyWith(
                    color: context.textTheme.labelMedium?.color?.withAlpha(200),
                    fontWeight: FontWeight.w600,
                  ),
                ).tr(),
                if (asset.isRemote && !asset.isReadOnly)
                  IconButton(
                    onPressed: editLocation,
                    icon: const Icon(Icons.edit_outlined),
                    iconSize: 20,
                  ),
              ],
            ),
            ExifMap(
              exifInfo: exifInfo!,
              formattedDateTime: formattedDateTime,
              markerId: asset.remoteId,
            ),
            RichText(
              text: TextSpan(
                style: context.textTheme.labelLarge,
                children: [
                  if (exifInfo != null && exifInfo?.city != null)
                    TextSpan(
                      text: exifInfo!.city,
                    ),
                  if (exifInfo != null &&
                      exifInfo?.city != null &&
                      exifInfo?.state != null)
                    const TextSpan(
                      text: ", ",
                    ),
                  if (exifInfo != null && exifInfo?.state != null)
                    TextSpan(
                      text: exifInfo!.state,
                    ),
                ],
              ),
            ),
            Text(
              "${exifInfo!.latitude!.toStringAsFixed(4)}, ${exifInfo!.longitude!.toStringAsFixed(4)}",
              style: context.textTheme.labelMedium?.copyWith(
                color: context.textTheme.labelMedium?.color?.withAlpha(150),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

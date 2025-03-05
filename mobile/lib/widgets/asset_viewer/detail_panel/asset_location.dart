import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';
import 'package:immich_mobile/widgets/asset_viewer/detail_panel/exif_map.dart';

class AssetLocation extends HookConsumerWidget {
  final Asset asset;

  const AssetLocation({
    super.key,
    required this.asset,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetWithExif = ref.watch(assetDetailProvider(asset));
    final ExifInfo? exifInfo = (assetWithExif.value ?? asset).exifInfo;
    final hasCoordinates = exifInfo?.hasCoordinates ?? false;

    void editLocation() {
      handleEditLocation(ref, context, [assetWithExif.value ?? asset]);
    }

    // Guard no lat/lng
    if (!hasCoordinates) {
      return asset.isRemote
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

    Widget getLocationName() {
      if (exifInfo == null) {
        return const SizedBox.shrink();
      }

      final cityName = exifInfo.city;
      final stateName = exifInfo.state;

      bool hasLocationName = (cityName != null && stateName != null);

      return hasLocationName
          ? Text(
              "$cityName, $stateName",
              style: context.textTheme.labelLarge,
            )
          : const SizedBox.shrink();
    }

    return Padding(
      padding: EdgeInsets.only(top: asset.isRemote ? 0 : 16),
      child: Column(
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
              if (asset.isRemote)
                IconButton(
                  onPressed: editLocation,
                  icon: const Icon(Icons.edit_outlined),
                  iconSize: 20,
                ),
            ],
          ),
          asset.isRemote ? const SizedBox.shrink() : const SizedBox(height: 16),
          ExifMap(
            exifInfo: exifInfo!,
            markerId: asset.remoteId,
          ),
          const SizedBox(height: 16),
          getLocationName(),
          Text(
            "${exifInfo.latitude!.toStringAsFixed(4)}, ${exifInfo.longitude!.toStringAsFixed(4)}",
            style: context.textTheme.labelMedium?.copyWith(
              color: context.textTheme.labelMedium?.color?.withAlpha(150),
            ),
          ),
        ],
      ),
    );
  }
}

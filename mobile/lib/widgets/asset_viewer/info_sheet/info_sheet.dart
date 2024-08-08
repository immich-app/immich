import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/widgets/asset_viewer/description_input.dart';
import 'package:immich_mobile/widgets/asset_viewer/info_sheet/asset_date_time.dart';
import 'package:immich_mobile/widgets/asset_viewer/info_sheet/exif_detail.dart';
import 'package:immich_mobile/widgets/asset_viewer/info_sheet/exif_image_properties.dart';
import 'package:immich_mobile/widgets/asset_viewer/info_sheet/exif_location.dart';
import 'package:immich_mobile/widgets/asset_viewer/info_sheet/exif_people.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/providers/asset.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';

class InfoSheet extends HookConsumerWidget {
  final Asset asset;

  const InfoSheet({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    print("Exif Info: ${asset.exifInfo}");
    return SingleChildScrollView(
      padding: const EdgeInsets.only(
        bottom: 50,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          const horizontalPadding = 16.0;

          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: horizontalPadding,
                ),
                child: Column(
                  children: [
                    AssetDateTime(asset: asset),
                    if (asset.isRemote) DescriptionInput(asset: asset),
                    Padding(
                      padding: EdgeInsets.only(top: asset.isRemote ? 0 : 16.0),
                      child: ExifLocation(
                        asset: asset,
                        editLocation: () => handleEditLocation(
                          ref,
                          context,
                          [asset],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: ExifPeople(
                  asset: asset,
                  padding: const EdgeInsets.symmetric(
                    horizontal: horizontalPadding,
                  ),
                ),
              ),
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: horizontalPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Text(
                        "exif_bottom_sheet_details",
                        style: context.textTheme.labelMedium?.copyWith(
                          color: context.textTheme.labelMedium?.color
                              ?.withAlpha(200),
                          fontWeight: FontWeight.w600,
                        ),
                      ).tr(),
                    ),
                    ExifImageProperties(asset: asset),
                    // if (exifInfo?.make != null)
                    //   ListTile(
                    //     contentPadding: const EdgeInsets.all(0),
                    //     dense: true,
                    //     leading: Icon(
                    //       Icons.camera,
                    //       color: context.colorScheme.onSurface.withAlpha(200),
                    //     ),
                    //     title: Text(
                    //       "${exifInfo!.make} ${exifInfo.model}",
                    //       style: context.textTheme.labelLarge,
                    //     ),
                    //     subtitle: exifInfo.f != null ||
                    //             exifInfo.exposureSeconds != null ||
                    //             exifInfo.mm != null ||
                    //             exifInfo.iso != null
                    //         ? Text(
                    //             "ƒ/${exifInfo.fNumber}   ${exifInfo.exposureTime}   ${exifInfo.focalLength} mm   ISO ${exifInfo.iso ?? ''} ",
                    //             style: context.textTheme.bodySmall,
                    //           )
                    //         : null,
                    //   ),
                  ],
                ),
              ),
              const SizedBox(height: 50),
            ],
          );
        },
      ),
    );
  }
}

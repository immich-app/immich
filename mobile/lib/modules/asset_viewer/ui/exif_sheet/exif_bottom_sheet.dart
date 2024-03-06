import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/description_input.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_sheet/exif_location.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/exif_sheet/exif_people.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';
import 'package:immich_mobile/utils/bytes_units.dart';

class ExifBottomSheet extends HookConsumerWidget {
  final Asset asset;

  const ExifBottomSheet({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetWithExif = ref.watch(assetDetailProvider(asset));
    var textColor = context.isDarkTheme ? Colors.white : Colors.black;
    final ExifInfo? exifInfo = (assetWithExif.value ?? asset).exifInfo;
    // Format the date time with the timezone
    final (dt, timeZone) =
        (assetWithExif.value ?? asset).getTZAdjustedTimeAndOffset();
    final date = DateFormat.yMMMEd().format(dt);
    final time = DateFormat.jm().format(dt);

    String formattedDateTime = '$date • $time GMT${timeZone.formatAsOffset()}';

    final dateWidget = Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          formattedDateTime,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        if (asset.isRemote && !asset.isReadOnly)
          IconButton(
            onPressed: () => handleEditDateTime(
              ref,
              context,
              [assetWithExif.value ?? asset],
            ),
            icon: const Icon(Icons.edit_outlined),
            iconSize: 20,
          ),
      ],
    );

    return SingleChildScrollView(
      padding: const EdgeInsets.only(
        bottom: 50,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final horizontalPadding = constraints.maxWidth > 600 ? 24.0 : 16.0;
          if (constraints.maxWidth > 600) {
            // Two column
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
                  child: Column(
                    children: [
                      dateWidget,
                      if (asset.isRemote) DescriptionInput(asset: asset),
                    ],
                  ),
                ),
                ExifPeople(
                  asset: asset,
                  padding: EdgeInsets.symmetric(
                    horizontal: horizontalPadding,
                  ),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: horizontalPadding,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: ExifLocation(
                            asset: asset,
                            exifInfo: exifInfo,
                            editLocation: () => handleEditLocation(
                              ref,
                              context,
                              [assetWithExif.value ?? asset],
                            ),
                            formattedDateTime: formattedDateTime,
                          ),
                        ),
                      ),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 300),
                        child: Padding(
                          padding: const EdgeInsets.only(left: 8.0),
                          child: _ExifDetail(asset: asset, exifInfo: exifInfo),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            );
          }

          // One column
          return Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: horizontalPadding,
                ),
                child: Column(
                  children: [
                    dateWidget,
                    if (asset.isRemote) DescriptionInput(asset: asset),
                    ExifLocation(
                      asset: asset,
                      exifInfo: exifInfo,
                      editLocation: () => handleEditLocation(
                        ref,
                        context,
                        [assetWithExif.value ?? asset],
                      ),
                      formattedDateTime: formattedDateTime,
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16.0),
                child: ExifPeople(
                  asset: asset,
                  padding: EdgeInsets.symmetric(
                    horizontal: horizontalPadding,
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
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
                    _ImageProperties(asset: asset),
                    if (exifInfo?.make != null)
                      ListTile(
                        contentPadding: const EdgeInsets.all(0),
                        dense: true,
                        leading: Icon(
                          Icons.camera,
                          color: textColor.withAlpha(200),
                        ),
                        title: Text(
                          "${exifInfo!.make} ${exifInfo.model}",
                          style: context.textTheme.labelLarge,
                        ),
                        subtitle: exifInfo.f != null ||
                                exifInfo.exposureSeconds != null ||
                                exifInfo.mm != null ||
                                exifInfo.iso != null
                            ? Text(
                                "ƒ/${exifInfo.fNumber}   ${exifInfo.exposureTime}   ${exifInfo.focalLength} mm   ISO ${exifInfo.iso ?? ''} ",
                                style: context.textTheme.bodySmall,
                              )
                            : null,
                      ),
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

class _ImageProperties extends StatelessWidget {
  final Asset asset;

  const _ImageProperties({
    required this.asset,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;

    String resolution = asset.width != null && asset.height != null
        ? "${asset.height} x ${asset.width}  "
        : "";
    String fileSize = asset.exifInfo?.fileSize != null
        ? formatBytes(asset.exifInfo!.fileSize!)
        : "";
    String text = resolution + fileSize;
    final imgSizeString = text.isNotEmpty ? text : null;

    String? title;
    String? subtitle;

    if (imgSizeString == null && asset.fileName.isNotEmpty) {
      // There is only filename
      title = asset.fileName;
    } else if (imgSizeString != null && asset.fileName.isNotEmpty) {
      // There is both filename and size information
      title = asset.fileName;
      subtitle = imgSizeString;
    } else if (imgSizeString != null && asset.fileName.isEmpty) {
      title = imgSizeString;
    } else {
      return const SizedBox.shrink();
    }

    return ListTile(
      contentPadding: const EdgeInsets.all(0),
      dense: true,
      leading: Icon(
        Icons.image,
        color: textColor.withAlpha(200),
      ),
      titleAlignment: ListTileTitleAlignment.center,
      title: Text(
        title,
        style: context.textTheme.labelLarge,
      ),
      subtitle: subtitle == null ? null : Text(subtitle),
    );
  }
}

class _ExifDetail extends StatelessWidget {
  final Asset asset;
  final ExifInfo? exifInfo;

  const _ExifDetail({
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
        _ImageProperties(asset: asset),
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

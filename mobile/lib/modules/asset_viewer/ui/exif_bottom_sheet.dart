import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/duration_extensions.dart';
import 'package:immich_mobile/modules/asset_viewer/ui/description_input.dart';
import 'package:immich_mobile/modules/map/widgets/map_thumbnail.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';
import 'package:immich_mobile/utils/bytes_units.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:url_launcher/url_launcher.dart';

class ExifBottomSheet extends HookConsumerWidget {
  final Asset asset;

  const ExifBottomSheet({super.key, required this.asset});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetWithExif = ref.watch(assetDetailProvider(asset));
    final ExifInfo? exifInfo = (assetWithExif.value ?? asset).exifInfo;
    final textColor = context.isDarkTheme ? Colors.white : Colors.black;

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
      padding: const EdgeInsets.symmetric(horizontal: 8.0),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16.0),
        child: LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxWidth > 600) {
              // Two column
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  dateWidget,
                  if (asset.isRemote) DescriptionInput(asset: asset),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: _ExifLocation(
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
                  const SizedBox(height: 50),
                ],
              );
            }

            // One column
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                dateWidget,
                if (assetWithExif.value != null)
                  DescriptionInput(asset: assetWithExif.value!),
                _ExifLocation(
                  asset: asset,
                  exifInfo: exifInfo,
                  editLocation: () => handleEditLocation(
                    ref,
                    context,
                    [assetWithExif.value ?? asset],
                  ),
                  formattedDateTime: formattedDateTime,
                ),
                SizedBox(
                  height: exifInfo?.hasCoordinates ?? false ? 16.0 : 6.0,
                ),
                Column(
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
                const SizedBox(height: 50),
              ],
            );
          },
        ),
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

class _ExifMap extends StatelessWidget {
  final ExifInfo exifInfo;
  final String formattedDateTime;
  final String? markerId;

  const _ExifMap({
    required this.exifInfo,
    required this.formattedDateTime,
    this.markerId = 'marker',
  });

  @override
  Widget build(BuildContext context) {
    final hasCoordinates = exifInfo.hasCoordinates;
    Future<Uri?> createCoordinatesUri() async {
      if (!hasCoordinates) {
        return null;
      }

      final double latitude = exifInfo.latitude!;
      final double longitude = exifInfo.longitude!;

      const zoomLevel = 16;

      if (Platform.isAndroid) {
        Uri uri = Uri(
          scheme: 'geo',
          host: '$latitude,$longitude',
          queryParameters: {
            'z': '$zoomLevel',
            'q': '$latitude,$longitude($formattedDateTime)',
          },
        );
        if (await canLaunchUrl(uri)) {
          return uri;
        }
      } else if (Platform.isIOS) {
        var params = {
          'll': '$latitude,$longitude',
          'q': formattedDateTime,
          'z': '$zoomLevel',
        };
        Uri uri = Uri.https('maps.apple.com', '/', params);
        if (await canLaunchUrl(uri)) {
          return uri;
        }
      }

      return Uri(
        scheme: 'https',
        host: 'openstreetmap.org',
        queryParameters: {'mlat': '$latitude', 'mlon': '$longitude'},
        fragment: 'map=$zoomLevel/$latitude/$longitude',
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16.0),
      child: LayoutBuilder(
        builder: (context, constraints) {
          return MapThumbnail(
            centre: LatLng(
              exifInfo.latitude ?? 0,
              exifInfo.longitude ?? 0,
            ),
            height: 150,
            width: constraints.maxWidth,
            zoom: 12.0,
            assetMarkerRemoteId: markerId,
            onTap: (tapPosition, latLong) async {
              Uri? uri = await createCoordinatesUri();

              if (uri == null) {
                return;
              }

              debugPrint('Opening Map Uri: $uri');
              launchUrl(uri);
            },
          );
        },
      ),
    );
  }
}

class _ExifLocation extends StatelessWidget {
  final Asset asset;
  final ExifInfo? exifInfo;
  final void Function() editLocation;
  final String formattedDateTime;

  const _ExifLocation({
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
            _ExifMap(
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

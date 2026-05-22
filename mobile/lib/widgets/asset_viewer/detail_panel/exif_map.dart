import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:url_launcher/url_launcher.dart';

class ExifMap extends StatelessWidget {
  final ExifInfo exifInfo;
  // TODO: Pass in a BaseAsset instead of the ID and thumbhash when removing old timeline
  // This is currently structured this way because of the old timeline implementation
  // reusing this component
  final String? markerId;
  final String? markerAssetThumbhash;
  final MapCreatedCallback? onMapCreated;

  const ExifMap({
    super.key,
    required this.exifInfo,
    this.markerAssetThumbhash,
    this.markerId = 'marker',
    this.onMapCreated,
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
          queryParameters: {'z': '$zoomLevel', 'q': '$latitude,$longitude'},
        );
        if (await canLaunchUrl(uri)) {
          return uri;
        }
      } else if (Platform.isIOS) {
        var params = {'ll': '$latitude,$longitude', 'q': '$latitude,$longitude', 'z': '$zoomLevel'};
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

    return LayoutBuilder(
      builder: (context, constraints) {
        return MapThumbnail(
          centre: LatLng(exifInfo.latitude ?? 0, exifInfo.longitude ?? 0),
          height: 150,
          width: constraints.maxWidth,
          zoom: 12.0,
          assetMarkerRemoteId: markerId,
          assetThumbhash: markerAssetThumbhash,
          onTap: (tapPosition, latLong) async {
            Uri? uri = await createCoordinatesUri();

            if (uri == null) {
              return;
            }

            dPrint(() => 'Opening Map Uri: $uri');
            unawaited(launchUrl(uri));
          },
          onCreated: onMapCreated,
        );
      },
    );
  }
}

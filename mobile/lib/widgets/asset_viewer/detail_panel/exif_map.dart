import 'dart:io';

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:immich_mobile/widgets/map/map_thumbnail.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:url_launcher/url_launcher.dart';

class ExifMap extends StatelessWidget {
  final ExifInfo exifInfo;
  final String? markerId;

  const ExifMap({
    super.key,
    required this.exifInfo,
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
            'q': '$latitude,$longitude',
          },
        );
        if (await canLaunchUrl(uri)) {
          return uri;
        }
      } else if (Platform.isIOS) {
        var params = {
          'll': '$latitude,$longitude',
          'q': '$latitude,$longitude',
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

    return LayoutBuilder(
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
    );
  }
}

// TODO: Dedupe against lib/utils/map_utils.dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapUtils {
  static final Logger _logger = Logger("MapUtils");

  static const mapZoomToAssetLevel = 12.0;
  static const defaultSourceId = 'asset-map-markers';
  static const defaultHeatMapLayerId = 'asset-heatmap-layer';

  static const defaultHeatmapLayerProperties = HeatmapLayerProperties(
    heatmapColor: [
      Expressions.interpolate,
      ["linear"],
      ["heatmap-density"],
      0.0,
      "rgba(103,58,183,0.0)",
      0.3,
      "rgb(103,58,183)",
      0.5,
      "rgb(33,149,243)",
      0.7,
      "rgb(76,175,79)",
      0.95,
      "rgb(255,235,59)",
      1.0,
      "rgb(255,86,34)",
    ],
    heatmapIntensity: [
      Expressions.interpolate,
      ["linear"],
      [Expressions.zoom],
      0,
      0.5,
      9,
      2,
    ],
    heatmapRadius: [
      Expressions.interpolate,
      ["linear"],
      [Expressions.zoom],
      0,
      4,
      4,
      8,
      9,
      16,
    ],
    heatmapOpacity: 0.7,
  );

  static Future<(Position?, LocationPermission?)> checkPermAndGetLocation({
    required BuildContext context,
    bool silent = false,
  }) async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!context.mounted) {
        return (null, LocationPermission.unableToDetermine);
      }

      if (!serviceEnabled && !silent) {
        unawaited(showDialog(context: context, builder: (context) => _LocationServiceDisabledDialog(context)));
        return (null, LocationPermission.deniedForever);
      }

      LocationPermission permission = await Geolocator.checkPermission();
      bool shouldRequestPermission = false;

      if (permission == LocationPermission.denied && !silent) {
        if (!context.mounted) {
          return (null, LocationPermission.unableToDetermine);
        }

        shouldRequestPermission = await showDialog(
          context: context,
          builder: (context) => _LocationPermissionDisabledDialog(context),
        );
        if (shouldRequestPermission) {
          permission = await Geolocator.requestPermission();
        }
      }

      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        // Open app settings only if you did not request for permission before
        if (permission == LocationPermission.deniedForever && !shouldRequestPermission && !silent) {
          await Geolocator.openAppSettings();
        }
        return (null, LocationPermission.deniedForever);
      }

      final Position currentUserLocation = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 0,
          timeLimit: Duration(seconds: 5),
        ),
      );
      return (currentUserLocation, null);
    } catch (error, stack) {
      _logger.severe("Cannot get user's current location", error, stack);
      return (null, LocationPermission.unableToDetermine);
    }
  }

  /// Reads each source's attribution from the loaded style
  static Future<List<MapAttribution>> getAttributions(MapLibreMapController controller) async {
    try {
      final sourceIds = await controller.getSourceIds();

      final sources = await Future.wait(sourceIds.map(controller.getSourceProperties));
      final attributions = await Future.wait(sources.nonNulls.map(_getSourceAttribution));

      return attributions.nonNulls
          .toSet()
          .map(_parseAttribution)
          .where((attribution) => attribution.text.isNotEmpty)
          .toList();
    } catch (error, stack) {
      _logger.warning("Cannot load map attributions", error, stack);
      return [];
    }
  }

  static Future<String?> _getSourceAttribution(Map<String, dynamic> source) async {
    final attribution = source['attribution'] as String?;
    final url = source['url'] as String?;

    if (attribution != null || url == null || !url.startsWith('http')) {
      return attribution;
    }

    // Fall back to fetching attribution info
    final response = await NetworkRepository.client.get(Uri.parse(url));
    return (jsonDecode(response.body) as Map<String, dynamic>)['attribution'] as String?;
  }

  static MapAttribution _parseAttribution(String html) {
    final link = RegExp(r'href="([^"]+)"').firstMatch(html)?.group(1);
    final text = html.replaceAll(RegExp(r'<[^>]*>'), '').replaceAll('&copy;', '©').replaceAll('&amp;', '&').trim();

    return (text: text, url: link == null ? null : Uri.tryParse(link));
  }
}

typedef MapAttribution = ({String text, Uri? url});

class _LocationServiceDisabledDialog extends ConfirmDialog {
  _LocationServiceDisabledDialog(BuildContext context)
    : super(
        title: context.t.map_location_service_disabled_title,
        content: context.t.map_location_service_disabled_content,
        cancel: context.t.cancel,
        ok: context.t.yes,
        onOk: () async {
          await Geolocator.openLocationSettings();
        },
      );
}

class _LocationPermissionDisabledDialog extends ConfirmDialog {
  _LocationPermissionDisabledDialog(BuildContext context)
    : super(
        title: context.t.map_no_location_permission_title,
        content: context.t.map_no_location_permission_content,
        cancel: context.t.cancel,
        ok: context.t.yes,
        onOk: () {},
      );
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:logging/logging.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapUtils {
  static final Logger _logger = Logger("MapUtils");

  static const mapZoomToAssetLevel = 12.0;
  static const defaultSourceId = 'asset-map-markers';
  static const defaultHeatMapLayerId = 'asset-heatmap-layer';
  static var markerCompleter = Completer()..complete();

  static const defaultCircleLayerLayerProperties = CircleLayerProperties(
    circleRadius: 10,
    circleColor: "rgba(150,86,34,0.7)",
    circleBlur: 1.0,
    circleOpacity: 0.7,
    circleStrokeWidth: 0.1,
    circleStrokeColor: "rgba(203,46,19,0.5)",
    circleStrokeOpacity: 0.7,
  );

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
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled && !silent) {
        showDialog(context: context, builder: (context) => _LocationServiceDisabledDialog(context));
        return (null, LocationPermission.deniedForever);
      }

      LocationPermission permission = await Geolocator.checkPermission();
      bool shouldRequestPermission = false;

      if (permission == LocationPermission.denied && !silent) {
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

      Position currentUserLocation = await Geolocator.getCurrentPosition(
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
}

class _LocationServiceDisabledDialog extends ConfirmDialog {
  _LocationServiceDisabledDialog(BuildContext context)
    : super(
        title: 'map_location_service_disabled_title'.t(context: context),
        content: 'map_location_service_disabled_content'.t(context: context),
        cancel: 'cancel'.t(context: context),
        ok: 'yes'.t(context: context),
        onOk: () async {
          await Geolocator.openLocationSettings();
        },
      );
}

class _LocationPermissionDisabledDialog extends ConfirmDialog {
  _LocationPermissionDisabledDialog(BuildContext context)
    : super(
        title: 'map_no_location_permission_title'.t(context: context),
        content: 'map_no_location_permission_content'.t(context: context),
        cancel: 'cancel'.t(context: context),
        ok: 'yes'.t(context: context),
        onOk: () {},
      );
}

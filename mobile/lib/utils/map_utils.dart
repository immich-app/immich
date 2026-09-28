// TODO: Dedupe against lib/presentation/widgets/map/map_utils.dart
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:logging/logging.dart';

class MapUtils {
  const MapUtils._();

  static final Logger _log = Logger("MapUtils");

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
        unawaited(showDialog(context: context, builder: (context) => _LocationServiceDisabledDialog()));
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
          builder: (context) => _LocationPermissionDisabledDialog(),
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
      _log.severe("Cannot get user's current location", error, stack);
      return (null, LocationPermission.unableToDetermine);
    }
  }
}

class _LocationServiceDisabledDialog extends ConfirmDialog {
  _LocationServiceDisabledDialog()
    : super(
        title: StaticTranslations.instance.map_location_service_disabled_title,
        content: StaticTranslations.instance.map_location_service_disabled_content,
        cancel: StaticTranslations.instance.cancel,
        ok: StaticTranslations.instance.yes,
        onOk: () async {
          await Geolocator.openLocationSettings();
        },
      );
}

class _LocationPermissionDisabledDialog extends ConfirmDialog {
  _LocationPermissionDisabledDialog()
    : super(
        title: StaticTranslations.instance.map_no_location_permission_title,
        content: StaticTranslations.instance.map_no_location_permission_content,
        cancel: StaticTranslations.instance.cancel,
        ok: StaticTranslations.instance.yes,
        onOk: () {},
      );
}

import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/maplibrecontroller_extensions.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:immich_mobile/widgets/map/positioned_asset_marker_icon.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

/// A non-interactive thumbnail of a map in the given coordinates with optional markers
///
/// User can provide either a [assetMarkerRemoteId] to display the asset's thumbnail or set
/// [showMarkerPin] to true which would display a marker pin instead. If both are provided,
/// [assetMarkerRemoteId] will take precedence
class MapThumbnail extends HookConsumerWidget {
  final Function(Point<double>, LatLng)? onTap;
  final LatLng centre;
  final String? assetMarkerRemoteId;
  final bool showMarkerPin;
  final double zoom;
  final double height;
  final double width;
  final ThemeMode? themeMode;
  final bool showAttribution;

  const MapThumbnail({
    super.key,
    required this.centre,
    this.height = 100,
    this.width = 100,
    this.onTap,
    this.zoom = 8,
    this.assetMarkerRemoteId,
    this.showMarkerPin = false,
    this.themeMode,
    this.showAttribution = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offsettedCentre = LatLng(centre.latitude + 0.002, centre.longitude);
    final controller = useRef<MaplibreMapController?>(null);
    final position = useValueNotifier<Point<num>?>(null);

    Future<void> onMapCreated(MaplibreMapController mapController) async {
      controller.value = mapController;
      if (assetMarkerRemoteId != null) {
        // The iOS impl returns wrong toScreenLocation without the delay
        Future.delayed(
          const Duration(milliseconds: 100),
          () async =>
              position.value = await mapController.toScreenLocation(centre),
        );
      }
    }

    Future<void> onStyleLoaded() async {
      if (showMarkerPin && controller.value != null) {
        await controller.value?.addMarkerAtLatLng(centre);
      }
    }

    return MapThemeOveride(
      themeMode: themeMode,
      mapBuilder: (style) => SizedBox(
        height: height,
        width: width,
        child: ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(15)),
          child: Stack(
            alignment: Alignment.center,
            children: [
              style.widgetWhen(
                onData: (style) => MaplibreMap(
                  initialCameraPosition:
                      CameraPosition(target: offsettedCentre, zoom: zoom),
                  styleString: style,
                  onMapCreated: onMapCreated,
                  onStyleLoadedCallback: onStyleLoaded,
                  onMapClick: onTap,
                  doubleClickZoomEnabled: false,
                  dragEnabled: false,
                  zoomGesturesEnabled: false,
                  tiltGesturesEnabled: false,
                  scrollGesturesEnabled: false,
                  rotateGesturesEnabled: false,
                  myLocationEnabled: false,
                  attributionButtonMargins:
                      showAttribution == false ? const Point(-100, 0) : null,
                ),
              ),
              ValueListenableBuilder(
                valueListenable: position,
                builder: (_, value, __) => value != null
                    ? PositionedAssetMarkerIcon(
                        size: height / 2,
                        point: value,
                        assetRemoteId: assetMarkerRemoteId!,
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

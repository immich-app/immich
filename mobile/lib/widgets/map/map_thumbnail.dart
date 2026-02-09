import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:immich_mobile/widgets/map/positioned_asset_marker_icon.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

/// A non-interactive thumbnail of a map in the given coordinates with optional markers
class MapThumbnail extends HookConsumerWidget {
  final Function(Point<double>, LatLng)? onTap;
  final LatLng? centre;
  final String? assetMarkerRemoteId;
  final String? assetThumbhash;
  final bool showMarkerPin;
  final double zoom;
  final double height;
  final double width;
  final ThemeMode? themeMode;
  final bool showAttribution;
  final MapCreatedCallback? onCreated;
  final double borderRadius;

  const MapThumbnail({
    super.key,
    this.centre,
    this.height = 100,
    this.width = 100,
    this.onTap,
    this.zoom = 8,
    this.assetMarkerRemoteId,
    this.assetThumbhash,
    this.showMarkerPin = false,
    this.themeMode,
    this.showAttribution = true,
    this.onCreated,
    this.borderRadius = 15,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useRef<MapLibreMapController?>(null);
    final styleLoaded = useState(false);
    final position = useValueNotifier<Point<num>?>(null);
    final dynamicCentre = ref.watch(mapMarkersCenterProvider);

    // Use provided centre or fallback to dynamic centre calculated from markers
    final LatLng finalCentre = centre ?? dynamicCentre.value ?? const LatLng(0, 0);

    Future<void> onMapCreated(MapLibreMapController mapController) async {
      controller.value = mapController;
      onCreated?.call(mapController);
    }

    Future<void> onStyleLoaded() async {
      if (context.mounted) {
        // Attempt to calculate screen position of the marker
        // Use a short delay to ensure MapLibre has processed the style and camera
        Future.delayed(const Duration(milliseconds: 100), () async {
          if (context.mounted && controller.value != null && finalCentre.latitude != 0) {
            try {
              position.value = await controller.value!.toScreenLocation(finalCentre);
            } catch (e) {
              // Fallback to manual center calculation if controller fails
              final ratio = MediaQuery.devicePixelRatioOf(context);
              position.value = Point(width * 0.5 * ratio, height * 0.5 * ratio);
            }
          }
        });
        styleLoaded.value = true;
      }
    }

    return MapThemeOverride(
      themeMode: themeMode,
      mapBuilder: (style) => AnimatedContainer(
        duration: Durations.medium2,
        curve: Curves.easeOut,
        foregroundDecoration: BoxDecoration(borderRadius: BorderRadius.all(Radius.circular(borderRadius))),
        height: height,
        width: width,
        child: ClipRRect(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          child: Stack(
            alignment: Alignment.center,
            children: [
              style.widgetWhen(
                onData: (style) {
                  if (style.isEmpty) {
                    return const Center(child: Icon(Icons.map_outlined, color: Colors.grey));
                  }
                  return MapLibreMap(
                    key: ValueKey("map_${finalCentre.latitude}_${finalCentre.longitude}_$zoom"),
                    initialCameraPosition: CameraPosition(target: finalCentre, zoom: zoom),
                    styleString: style,
                    onMapCreated: onMapCreated,
                    onStyleLoadedCallback: onStyleLoaded,
                    onMapClick: onTap,
                    myLocationEnabled: false,
                    trackCameraPosition: false,
                    compassEnabled: false,
                    zoomGesturesEnabled: false,
                    scrollGesturesEnabled: false,
                    rotateGesturesEnabled: false,
                    tiltGesturesEnabled: false,
                    doubleClickZoomEnabled: false,
                    attributionButtonPosition: AttributionButtonPosition.bottomLeft,
                    attributionButtonMargins: const Point(8, 8),
                  );
                },
                onError: (e, s) {
                  return const Center(child: Icon(Icons.location_off_outlined, color: Colors.red));
                },
                onLoading: () {
                  return const Center(child: CircularProgressIndicator(strokeWidth: 2));
                },
              ),
              ValueListenableBuilder(
                valueListenable: position,
                builder: (_, value, __) => value != null && assetMarkerRemoteId != null && assetThumbhash != null
                    ? PositionedAssetMarkerIcon(
                        size: height / 2,
                        point: value,
                        assetRemoteId: assetMarkerRemoteId!,
                        assetThumbhash: assetThumbhash!,
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

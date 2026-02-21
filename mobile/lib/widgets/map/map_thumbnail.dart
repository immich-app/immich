import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:immich_mobile/widgets/map/asset_marker_icon.dart';
import 'package:maplibre/maplibre.dart';

/// A non-interactive thumbnail of a map in the given coordinates with optional markers
///
/// User can provide either a [assetMarkerRemoteId] to display the asset's thumbnail or set
/// [showMarkerPin] to true which would display a marker pin instead. If both are provided,
/// [assetMarkerRemoteId] will take precedence
class MapThumbnail extends HookConsumerWidget {
  final Function(Offset, Geographic)? onTap;
  final Geographic centre;
  final String? assetMarkerRemoteId;
  final String? assetThumbhash;
  final bool showMarkerPin;
  final double zoom;
  final double height;
  final double width;
  final ThemeMode? themeMode;
  final bool showAttribution;
  final void Function(MapController)? onCreated;

  const MapThumbnail({
    super.key,
    required this.centre,
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
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final styleLoaded = useState(false);

    Future<void> onStyleLoaded(StyleController style) async {
      if (showMarkerPin) {
        await style.addImageFromAssets(id: 'mapMarker', asset: 'assets/location-pin.png');
      }
      styleLoaded.value = true;
    }

    void onEvent(MapEvent event) {
      if (event is MapEventClick && onTap != null) {
        onTap!(event.screenPoint, event.point);
      }
    }

    return MapThemeOverride(
      themeMode: themeMode,
      mapBuilder: (style) => AnimatedContainer(
        duration: Durations.medium2,
        curve: Curves.easeOut,
        foregroundDecoration: BoxDecoration(
          color: context.colorScheme.inverseSurface.withAlpha(styleLoaded.value ? 0 : 200),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        height: height,
        width: width,
        child: ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(15)),
          child: style.widgetWhen(
            onData: (style) => MapLibreMap(
              options: MapOptions(
                initCenter: Geographic(lat: centre.lat + 0.002, lon: centre.lon),
                initZoom: zoom,
                initStyle: style,
                gestures: const MapGestures.none(),
              ),
              onMapCreated: onCreated,
              onStyleLoaded: onStyleLoaded,
              onEvent: onEvent,
              layers: [
                if (showMarkerPin)
                  MarkerLayer(
                    points: [Feature(geometry: Point(centre))],
                    iconImage: 'mapMarker',
                    iconSize: 0.15,
                    iconAnchor: IconAnchor.bottom,
                    iconAllowOverlap: true,
                  ),
              ],
              children: [
                if (assetMarkerRemoteId != null && assetThumbhash != null)
                  WidgetLayer(
                    markers: [
                      Marker(
                        point: centre,
                        size: Size.square(height / 2),
                        alignment: Alignment.bottomCenter,
                        child: AssetMarkerIcon(id: assetMarkerRemoteId!, thumbhash: assetThumbhash!),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

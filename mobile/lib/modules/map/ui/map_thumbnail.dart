import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/utils/map_controller_hook.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

// A non-interactive thumbnail of a map in the given coordinates with optional markers
class MapThumbnail extends HookConsumerWidget {
  final Function(TapPosition, LatLng)? onTap;
  final LatLng coords;
  final double zoom;
  final List<Marker> markers;
  final double height;
  final double width;
  final bool showAttribution;
  final bool isDarkTheme;

  const MapThumbnail({
    super.key,
    required this.coords,
    this.height = 100,
    this.width = 100,
    this.onTap,
    this.zoom = 1,
    this.showAttribution = true,
    this.isDarkTheme = false,
    this.markers = const [],
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapController = useMapController();
    final isMapReady = useRef(false);
    ref.watch(mapStateNotifier.select((s) => s.mapStyle));

    useEffect(
      () {
        if (isMapReady.value && mapController.center != coords) {
          mapController.move(coords, zoom);
        }
        return null;
      },
      [coords],
    );

    return SizedBox(
      height: height,
      width: width,
      child: ClipRRect(
        borderRadius: const BorderRadius.all(Radius.circular(15)),
        child: FlutterMap(
          mapController: mapController,
          options: MapOptions(
            interactiveFlags: InteractiveFlag.none,
            center: coords,
            zoom: zoom,
            onTap: onTap,
            onMapReady: () => isMapReady.value = true,
          ),
          nonRotatedChildren: [
            if (showAttribution)
              RichAttributionWidget(
                animationConfig: const ScaleRAWA(),
                attributions: [
                  TextSourceAttribution(
                    'OpenStreetMap contributors',
                    onTap: () => launchUrl(
                      Uri.parse('https://openstreetmap.org/copyright'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
                ],
              ),
          ],
          children: [
            ref.read(mapStateNotifier.notifier).getTileLayer(isDarkTheme),
            if (markers.isNotEmpty) MarkerLayer(markers: markers),
          ],
        ),
      ),
    );
  }
}

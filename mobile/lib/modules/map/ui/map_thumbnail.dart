import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

// A non-interactive thumbnail of a map in the given coordinates with optional markers
class MapThumbnail extends HookConsumerWidget {
  final Function(TapPosition, LatLng)? onTap;
  final LatLng coords;
  final double zoom;
  final List<Marker> markers;
  final double height;
  final bool showAttribution;

  const MapThumbnail({
    super.key,
    required this.coords,
    required this.height,
    this.onTap,
    this.zoom = 1,
    this.showAttribution = true,
    this.markers = const [],
  });

  Widget _buildTileLayer(
    bool isDarkTheme,
  ) {
    Widget tile = TileLayer(
      urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      subdomains: const ['a', 'b', 'c'],
    );
    if (!isDarkTheme) {
      return tile;
    }
    return InvertionFilter(
      child: SaturationFilter(
        saturation: -1,
        child: tile,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapSettingsNotifier = ref.watch(mapStateNotifier);
    final isDarkTheme = useState(mapSettingsNotifier.isDarkTheme);

    useEffect(
      () {
        isDarkTheme.value = mapSettingsNotifier.isDarkTheme;
        return null;
      },
      [mapSettingsNotifier],
    );

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
      ),
      height: height,
      child: ClipRRect(
        borderRadius: const BorderRadius.all(Radius.circular(15)),
        child: FlutterMap(
          options: MapOptions(
            interactiveFlags: InteractiveFlag.none,
            center: coords,
            zoom: zoom,
            onTap: onTap,
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
                    ),
                  ),
                ],
              ),
          ],
          children: [
            _buildTileLayer(isDarkTheme.value),
            if (markers.isNotEmpty) MarkerLayer(markers: markers)
          ],
        ),
      ),
    );
  }
}

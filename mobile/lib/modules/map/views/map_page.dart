import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/ui/asset_marker.dart';
import 'package:immich_mobile/modules/map/ui/asset_marker_icon.dart';
import 'package:immich_mobile/modules/map/ui/cluster_marker.dart';
import 'package:immich_mobile/modules/map/ui/map_settings_dialog.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:latlong2/latlong.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:url_launcher/url_launcher.dart';

class MapPage extends HookConsumerWidget {
  const MapPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ThemeData theme = Theme.of(context);
    final log = Logger("MapService");
    final mapState = ref.watch(mapStateNotifier);
    final isDarkTheme = useState(mapState.isDarkTheme);
    var mapMarkerProvider = ref.watch(mapMarkerFutureProvider);
    final ValueNotifier<List<MapMarkerResponseDto>?> mapMarkers =
        useState(<MapMarkerResponseDto>[]);

    useEffect(
      () {
        isDarkTheme.value = mapState.isDarkTheme;
        return null;
      },
      [mapState.isDarkTheme],
    );

    mapMarkers.value = mapMarkerProvider.when(
      skipLoadingOnRefresh: false,
      error: (error, stackTrace) {
        log.warning(
          "Cannot get map markers ${error.toString()}",
          error,
          stackTrace,
        );
        return [];
      },
      // Using null as a loading indicator
      loading: () => null,
      data: (data) {
        if (data == null) return [];
        return data;
      },
    );

    useEffect(
      () {
        return () => ref.invalidate(mapMarkerFutureProvider);
      },
      [mapState.relativeTime, mapState.showFavoriteOnly],
    );

    Widget buildBackButton() {
      return ElevatedButton(
        onPressed: () async => await AutoRouter.of(context).pop(),
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
          padding: const EdgeInsets.all(12),
          backgroundColor: Colors.white,
          foregroundColor: theme.colorScheme.onPrimary,
        ),
        child: Icon(
          Icons.arrow_back_ios_rounded,
          color: isDarkTheme.value ? Colors.black : theme.colorScheme.onPrimary,
        ),
      );
    }

    Widget buildSettingsButton() {
      return ElevatedButton(
        onPressed: () {
          showDialog(
            context: context,
            builder: (BuildContext _) {
              return const MapSettingsDialog();
            },
          );
        },
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
          padding: const EdgeInsets.all(12),
          backgroundColor: Colors.white,
          foregroundColor: theme.colorScheme.onPrimary,
        ),
        child: Icon(
          Icons.more_vert_rounded,
          color: isDarkTheme.value ? Colors.black : theme.colorScheme.onPrimary,
        ),
      );
    }

    Widget buildAttribution() {
      return RichAttributionWidget(
        animationConfig: const ScaleRAWA(), // Or `FadeRAWA` as is default
        attributions: [
          TextSourceAttribution(
            'OpenStreetMap contributors',
            onTap: () =>
                launchUrl(Uri.parse('https://openstreetmap.org/copyright')),
          ),
          const TextSourceAttribution(
            'This attribution is the same throughout this app, except where otherwise specified',
            prependCopyright: false,
          ),
        ],
      );
    }

    Widget buildTileLayer() {
      Widget tileLayer = TileLayer(
        urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        subdomains: const ['a', 'b', 'c'],
        maxNativeZoom: 19,
        maxZoom: 19,
      );
      if (!isDarkTheme.value) {
        return tileLayer;
      }
      return InvertionFilter(
        child: SaturationFilter(
          saturation: -1,
          child: BrightnessFilter(
            brightness: -1,
            child: tileLayer,
          ),
        ),
      );
    }

    Size getClusterSize(List<Marker> markers) {
      final size = markers.length >= 1000
          ? 80.0
          : markers.length >= 100
              ? 60.0
              : markers.length >= 10
                  ? 50.0
                  : 40.0;
      return Size(size, size);
    }

    int getSpiderifyRadius(int markersLength) {
      return markersLength <= 4
          ? 80
          : markersLength <= 7
              ? 110
              : 150;
    }

    Future<void> navigateToAsset(AssetMarker marker) async {
      final asset = await ref.read(
        mapMarkerAssetProvider(
          marker.remoteId,
        ).future,
      );
      if (asset != null) {
        AutoRouter.of(context).push(
          GalleryViewerRoute(
            initialIndex: 0,
            loadAsset: (index) => asset,
            totalAssets: 1,
            heroOffset: 0,
          ),
        );
      }
    }

    Widget buildMarkers() {
      return mapMarkers.value == null
          ? const Center(child: ImmichLoadingIndicator())
          : MarkerClusterLayerWidget(
              options: MarkerClusterLayerOptions(
                anchor: AnchorPos.align(AnchorAlign.center),
                disableClusteringAtZoom: 19,
                maxChildrenToSpiderfy: 11,
                computeSpiderfyRadius: getSpiderifyRadius,
                circleSpiralSwitchover: -1,
                showPolygon: false,
                size: const Size(40, 40),
                computeSize: getClusterSize,
                markers: mapMarkers.value!
                    .map(
                      (e) => AssetMarker(
                        remoteId: e.id,
                        anchorPos: AnchorPos.align(AnchorAlign.center),
                        point: LatLng(
                          e.lat,
                          e.lon,
                        ),
                        width: 80,
                        height: 80,
                        builder: (ctx) => AssetMarkerIcon(
                          id: e.id,
                        ),
                      ),
                    )
                    .toList(),
                builder: (context, markers) {
                  return ClusterMarkerIcon(
                    markers: markers,
                    isDarkTheme: isDarkTheme.value,
                  );
                },
                onClusterTap: (cluster) async {
                  if (cluster.mapMarkers.length > 10) {
                    final exifInfo = await ref.read(
                      mapMarkerExifInfoProvider(
                        (cluster.mapMarkers[0] as AssetMarker).remoteId,
                      ).future,
                    );
                    var openFirstAsset = true;
                    if (exifInfo != null) {
                      final searchTerm = cluster.zoom > 12
                          ? exifInfo.city
                          : cluster.zoom > 9
                              ? exifInfo.state
                              : cluster.zoom > 4
                                  ? exifInfo.country
                                  : null;
                      if (searchTerm != null) {
                        openFirstAsset = false;
                        AutoRouter.of(context).push(
                          SearchResultRoute(searchTerm: 'm:$searchTerm'),
                        );
                      }
                    }
                    if (openFirstAsset && cluster.zoom > 8) {
                      await navigateToAsset(
                          cluster.mapMarkers[0] as AssetMarker);
                    }
                  }
                },
                onMarkerTap: (marker) async {
                  await navigateToAsset(marker as AssetMarker);
                },
              ),
            );
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.black.withOpacity(0.5),
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: FlutterMap(
          options: MapOptions(
            maxBounds: LatLngBounds(LatLng(-90, -180.0), LatLng(90.0, 180.0)),
            interactiveFlags: InteractiveFlag.doubleTapZoom |
                InteractiveFlag.drag |
                InteractiveFlag.flingAnimation |
                InteractiveFlag.pinchMove |
                InteractiveFlag.pinchZoom,
            center: LatLng(20, 20),
            zoom: 2,
            minZoom: 1,
            maxZoom: 19, // max level supported by OSM,
          ),
          nonRotatedChildren: [
            Positioned(
              top: 60,
              height: 50,
              left: 10,
              width: 50,
              child: buildBackButton(),
            ),
            Positioned(
              top: 60,
              height: 50,
              right: 10,
              width: 50,
              child: buildSettingsButton(),
            ),
            buildAttribution(),
          ],
          children: [buildTileLayer(), buildMarkers()],
        ),
      ),
    );
  }
}

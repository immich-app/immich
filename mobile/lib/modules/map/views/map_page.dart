import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:flutter_map_heatmap/flutter_map_heatmap.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_subscription_event.mode.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/ui/asset_marker.dart';
import 'package:immich_mobile/modules/map/ui/asset_marker_icon.dart';
import 'package:immich_mobile/modules/map/ui/assets_in_bound_sheet.dart';
import 'package:immich_mobile/modules/map/ui/map_settings_dialog.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:latlong2/latlong.dart';
import 'package:logging/logging.dart';
import 'package:url_launcher/url_launcher.dart';

class MapPage extends StatefulHookConsumerWidget {
  const MapPage({super.key});

  @override
  MapPageState createState() => MapPageState();
}

class MapPageState extends ConsumerState<MapPage>
    with TickerProviderStateMixin {
  // State variables
  late final MapController _mapController;
  final StreamController mapPageEventSC =
      StreamController<MapPageEventBase>.broadcast();
  final StreamController bottomSheetEventSC =
      StreamController<MapPageEventBase>.broadcast();
  StreamSubscription<dynamic>? bottomSheetEventStream;
  List<AssetMarkerData> assetsInBounds = [];
  late final Debounce debounceBoundsUpdate;
  late final DraggableScrollableController bottomSheetScrollController;

  List<AssetMarkerData> getAssetsMarkersInBound(
    List<AssetMarkerData>? assetMarkers,
  ) {
    final bounds = _mapController.bounds;
    return bounds != null
        ? assetMarkers
                ?.where((e) => bounds.contains(e.point))
                .map((e) => e)
                .toList() ??
            []
        : [];
  }

  void reloadAssetsInBound(List<AssetMarkerData>? assetMarkers) {
    final bounds = _mapController.bounds;
    if (bounds != null) {
      assetsInBounds = getAssetsMarkersInBound(assetMarkers);
      mapPageEventSC.add(
        MapPageAssetsInBoundUpdated(
          assetsInBounds.map((e) => e.asset).toList(),
        ),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    bottomSheetScrollController = DraggableScrollableController();
    // Map zoom events and move events are triggered often. Throttle the call to limit rebuilds
    debounceBoundsUpdate = Debounce(
      const Duration(milliseconds: 100),
    );
  }

  @override
  void dispose() {
    super.dispose();
    debounceBoundsUpdate.dispose();
    bottomSheetEventStream?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    final log = Logger("MapService");
    final mapState = ref.watch(mapStateNotifier);
    final isDarkTheme = useState(mapState.isDarkTheme);
    final buttonThemeData =
        useState(isDarkTheme.value ? immichDarkTheme : immichLightTheme);
    final ValueNotifier<List<AssetMarkerData>?> mapMarkers =
        useState(<AssetMarkerData>[]);
    final heatMapData = useState(<WeightedLatLng>[]);
    final ValueNotifier<AssetMarkerData?> selectedAsset = useState(null);

    CustomPoint<double> rotatePoint(
      CustomPoint<double> mapCenter,
      CustomPoint<double> point, {
      bool counterRotation = true,
    }) {
      final counterRotationFactor = counterRotation ? -1 : 1;

      final m = Matrix4.identity()
        ..translate(mapCenter.x, mapCenter.y)
        ..rotateZ(degToRadian(_mapController.rotation) * counterRotationFactor)
        ..translate(-mapCenter.x, -mapCenter.y);

      final tp = MatrixUtils.transformPoint(m, Offset(point.x, point.y));

      return CustomPoint(tp.dx, tp.dy);
    }

    LatLng? moveByBottomPadding(
      LatLng coordinates,
      Offset offset,
    ) {
      const crs = Epsg3857();
      final oldCenterPt = crs.latLngToPoint(coordinates, _mapController.zoom);
      final mapCenterPoint = rotatePoint(
        oldCenterPt,
        oldCenterPt - CustomPoint(offset.dx, offset.dy),
      );
      return crs.pointToLatLng(mapCenterPoint, _mapController.zoom);
    }

    useEffect(
      () {
        bottomSheetEventStream = bottomSheetEventSC.stream.listen((event) {
          if (event is MapPageBottomSheetScrolled) {
            final asset = event.asset;
            if (asset != null) {
              final assetMarker = mapMarkers.value
                  ?.firstWhere((element) => element.asset.id == asset.id);
              selectedAsset.value = assetMarker;
              if (assetMarker != null && _mapController.zoom >= 5) {
                LatLng? newCenter = moveByBottomPadding(
                  assetMarker.point,
                  const Offset(0, -120),
                );
                if (newCenter != null) {
                  _mapController.move(
                    newCenter,
                    _mapController.zoom,
                  );
                }
              }
            }
          }
        });
        return null;
      },
      [],
    );

    useEffect(
      () {
        isDarkTheme.value = mapState.isDarkTheme;
        themeCallBack() {
          buttonThemeData.value =
              isDarkTheme.value ? immichDarkTheme : immichLightTheme;
        }

        isDarkTheme.addListener(themeCallBack);
        return () {
          isDarkTheme.removeListener(themeCallBack);
        };
      },
      [mapState.isDarkTheme],
    );

    mapMarkers.value = ref.watch(mapMarkerFutureProvider).when(
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
          data: (data) => data,
        );

    useEffect(
      () {
        mapMarkersCallback() {
          heatMapData.value = mapMarkers.value
                  ?.map(
                    (e) => WeightedLatLng(
                      LatLng(e.point.latitude, e.point.longitude),
                      1,
                    ),
                  )
                  .toList() ??
              [];
          debounceBoundsUpdate(() => reloadAssetsInBound(mapMarkers.value));
        }

        mapMarkers.addListener(mapMarkersCallback);

        return () {
          ref.invalidate(mapMarkerFutureProvider);
          mapMarkers.removeListener(mapMarkersCallback);
        };
      },
      [mapState.relativeTime, mapState.showFavoriteOnly],
    );

    Widget buildBackButton() {
      return ElevatedButton(
        onPressed: () async => await AutoRouter.of(context).pop(),
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
          padding: const EdgeInsets.all(12),
          backgroundColor:
              isDarkTheme.value ? Colors.grey[900] : Colors.grey[100],
          foregroundColor: isDarkTheme.value
              ? Colors.grey[100]
              : buttonThemeData.value.textTheme.displayLarge?.color,
        ),
        child: Icon(
          Icons.arrow_back_ios_rounded,
          color: isDarkTheme.value
              ? Colors.grey[100]
              : buttonThemeData.value.textTheme.displayLarge?.color,
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
          backgroundColor:
              isDarkTheme.value ? Colors.grey[900] : Colors.grey[100],
          foregroundColor: isDarkTheme.value
              ? Colors.grey[100]
              : buttonThemeData.value.textTheme.displayLarge?.color,
        ),
        child: Icon(
          Icons.more_vert_rounded,
          color: isDarkTheme.value
              ? Colors.grey[100]
              : buttonThemeData.value.textTheme.displayLarge?.color,
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

    void navigateToAsset(Asset asset) {
      AutoRouter.of(context).push(
        GalleryViewerRoute(
          initialIndex: 0,
          loadAsset: (index) => asset,
          totalAssets: 1,
          heroOffset: 0,
        ),
      );
    }

    Widget buildMarkerLayer() {
      final selectedMarker = selectedAsset.value;
      return MarkerLayer(
        markers: [
          if (selectedMarker != null)
            AssetMarker(
              remoteId: selectedMarker.asset.remoteId!,
              anchorPos: AnchorPos.align(AnchorAlign.top),
              point: selectedMarker.point,
              width: 100,
              height: 100,
              builder: (ctx) => GestureDetector(
                onTap: () => navigateToAsset(selectedMarker.asset),
                child: AssetMarkerIcon(
                  isDarkTheme: isDarkTheme.value,
                  id: selectedMarker.asset.remoteId!,
                ),
              ),
            ),
        ],
      );
    }

    Widget buildHeatMapLayer() {
      return heatMapData.value.isNotEmpty
          ? HeatMapLayer(
              heatMapDataSource: InMemoryHeatMapDataSource(
                data: heatMapData.value,
              ),
              heatMapOptions: HeatMapOptions(
                radius: 60,
                layerOpacity: 0.5,
                gradient: {
                  0.20: Colors.deepPurple,
                  0.40: Colors.blue,
                  0.60: Colors.green,
                  0.95: Colors.yellow,
                  1.0: Colors.deepOrange
                },
              ),
            )
          : const SizedBox.shrink();
    }

    void onMapEvent(MapEvent mapEvent) {
      if (mapEvent.source != MapEventSource.mapController &&
          (mapEvent is MapEventMove || mapEvent is MapEventDoubleTapZoom)) {
        debounceBoundsUpdate(() => reloadAssetsInBound(mapMarkers.value));
      }
    }

    double getDistance(LatLng a, LatLng b) {
      return const Distance().distance(a, b);
    }

    double getThreshold(double zoomLevel) {
      const scale = [
        25000000,
        15000000,
        8000000,
        4000000,
        2000000,
        1000000,
        500000,
        250000,
        100000,
        50000,
        25000,
        15000,
        8000,
        4000,
        2000,
        1000,
        500,
        250,
        100,
        50,
        25,
        10,
        5
      ];
      return scale[math.max(0, math.min(20, zoomLevel.round() + 2))]
              .toDouble() /
          6;
    }

    void onTapEvent(TapPosition tapPosition, LatLng point) {
      assetsInBounds.sort(
        (a, b) =>
            getDistance(a.point, point).compareTo(getDistance(b.point, point)),
      );
      final currentZoom = _mapController.zoom;
      // First asset less than the threshold from the tap point
      selectedAsset.value = assetsInBounds.firstWhereOrNull(
        (element) =>
            getDistance(element.point, point) < getThreshold(currentZoom),
      );
      if (selectedAsset.value == null) {
        bottomSheetScrollController.animateTo(
          0.1,
          duration: const Duration(milliseconds: 200),
          curve: Curves.linearToEaseOut,
        );
        mapPageEventSC.add(
          const MapPageOnTapEvent(),
        );
      }
    }

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor: Colors.black.withOpacity(0.5),
        statusBarIconBrightness: Brightness.light,
      ),
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                maxBounds:
                    LatLngBounds(LatLng(-90, -180.0), LatLng(90.0, 180.0)),
                interactiveFlags: InteractiveFlag.doubleTapZoom |
                    InteractiveFlag.drag |
                    InteractiveFlag.flingAnimation |
                    InteractiveFlag.pinchMove |
                    InteractiveFlag.pinchZoom,
                center: LatLng(20, 20),
                zoom: 2,
                minZoom: 1,
                maxZoom: 18, // max level supported by OSM,
                onMapReady: () {
                  _mapController.mapEventStream.listen(onMapEvent);
                },
                onTap: onTapEvent,
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
              children: [
                buildTileLayer(),
                buildHeatMapLayer(),
                buildMarkerLayer(),
              ],
            ),
            Theme(
              data: isDarkTheme.value ? immichDarkTheme : immichLightTheme,
              child: AssetsInBoundBottomSheet(
                mapPageEventSC.stream,
                bottomSheetEventSC,
                scrollableController: bottomSheetScrollController,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

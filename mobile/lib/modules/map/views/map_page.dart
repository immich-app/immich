import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/plugin_api.dart';
import 'package:flutter_map_heatmap/flutter_map_heatmap.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_page_event.model.dart';
import 'package:immich_mobile/modules/map/providers/map_marker.provider.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/modules/map/ui/asset_marker_icon.dart';
import 'package:immich_mobile/modules/map/ui/location_dialog.dart';
import 'package:immich_mobile/modules/map/ui/map_page_bottom_sheet.dart';
import 'package:immich_mobile/modules/map/ui/map_page_app_bar.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/utils/color_filter_generator.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/utils/flutter_map_extensions.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:immich_mobile/utils/selection_handlers.dart';
import 'package:latlong2/latlong.dart';
import 'package:logging/logging.dart';

class MapPage extends StatefulHookConsumerWidget {
  const MapPage({super.key});

  @override
  MapPageState createState() => MapPageState();
}

class MapPageState extends ConsumerState<MapPage> {
  // Non-State variables
  late final MapController mapController;
  // Streams are used instead of callbacks to prevent unnecessary rebuilds on events
  final StreamController mapPageEventSC =
      StreamController<MapPageEventBase>.broadcast();
  final StreamController bottomSheetEventSC =
      StreamController<MapPageEventBase>.broadcast();
  late final Stream bottomSheetEventStream;
  // Making assets in bounds as a state variable will result in un-necessary rebuilds of the bottom sheet
  // resulting in it getting reloaded each time a map move occurs
  Set<AssetMarkerData> assetsInBounds = {};
  // TODO: Migrate the handling to MapEventMove#id when flutter_map is upgraded
  // https://github.com/fleaflet/flutter_map/issues/1542
  // The below is used instead of MapEventMove#id to handle event from controller
  // in onMapEvent() since MapEventMove#id is not populated properly in the
  // current version of flutter_map(4.0.0) used
  bool forceAssetUpdate = false;
  late final Debounce debounce;

  @override
  void initState() {
    super.initState();
    mapController = MapController();
    bottomSheetEventStream = bottomSheetEventSC.stream;
    // Map zoom events and move events are triggered often. Throttle the call to limit rebuilds
    debounce = Debounce(
      const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    debounce.dispose();
    super.dispose();
  }

  void reloadAssetsInBound(
    Set<AssetMarkerData>? assetMarkers, {
    bool forceReload = false,
  }) {
    final bounds = mapController.bounds;
    if (bounds != null) {
      final oldAssetsInBounds = assetsInBounds.toSet();
      assetsInBounds =
          assetMarkers?.where((e) => bounds.contains(e.point)).toSet() ?? {};
      final shouldReload = forceReload ||
          assetsInBounds.difference(oldAssetsInBounds).isNotEmpty ||
          assetsInBounds.length != oldAssetsInBounds.length;
      if (shouldReload) {
        mapPageEventSC.add(
          MapPageAssetsInBoundUpdated(
            assetsInBounds.map((e) => e.asset).toList(),
          ),
        );
      }
    }
  }

  void openAssetInViewer(Asset asset) {
    AutoRouter.of(context).push(
      GalleryViewerRoute(
        initialIndex: 0,
        loadAsset: (index) => asset,
        totalAssets: 1,
        heroOffset: 0,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final log = Logger("MapService");
    final isDarkTheme =
        ref.watch(mapStateNotifier.select((state) => state.isDarkTheme));
    final ValueNotifier<Set<AssetMarkerData>> mapMarkerData =
        useState(<AssetMarkerData>{});
    final ValueNotifier<AssetMarkerData?> closestAssetMarker = useState(null);
    final selectionEnabledHook = useState(false);
    final selectedAssets = useState(<Asset>{});
    final showLoadingIndicator = useState(false);
    final refetchMarkers = useState(true);

    if (refetchMarkers.value) {
      mapMarkerData.value = ref.watch(mapMarkersProvider).when(
            skipLoadingOnRefresh: false,
            error: (error, stackTrace) {
              log.warning(
                "Cannot get map markers ${error.toString()}",
                error,
                stackTrace,
              );
              showLoadingIndicator.value = false;
              return {};
            },
            loading: () {
              showLoadingIndicator.value = true;
              return {};
            },
            data: (data) {
              showLoadingIndicator.value = false;
              refetchMarkers.value = false;
              closestAssetMarker.value = null;
              debounce(
                () => reloadAssetsInBound(
                  mapMarkerData.value,
                  forceReload: true,
                ),
              );
              return data;
            },
          );
    }

    ref.listen(mapStateNotifier, (previous, next) {
      bool shouldRefetch =
          previous?.showFavoriteOnly != next.showFavoriteOnly ||
              previous?.relativeTime != next.relativeTime;
      if (shouldRefetch) {
        refetchMarkers.value = shouldRefetch;
        ref.invalidate(mapMarkersProvider);
      }
    });

    void onZoomToAssetEvent(Asset? assetInBottomSheet) {
      if (assetInBottomSheet != null) {
        final mapMarker = mapMarkerData.value
            .firstWhereOrNull((e) => e.asset.id == assetInBottomSheet.id);
        if (mapMarker != null) {
          const zoomLevel = 16.0;
          LatLng? newCenter = mapController.centerBoundsWithPadding(
            mapMarker.point,
            const Offset(0, -120),
            zoomLevel: zoomLevel,
          );
          if (newCenter != null) {
            forceAssetUpdate = true;
            mapController.move(newCenter, zoomLevel);
          }
        }
      }
    }

    void onZoomToLocation() async {
      try {
        bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          showDialog(
            context: context,
            builder: (context) => Theme(
              data: isDarkTheme ? immichDarkTheme : immichLightTheme,
              child: LocationServiceDisabledDialog(),
            ),
          );
          return;
        }

        LocationPermission permission = await Geolocator.checkPermission();
        bool shouldRequestPermission = false;

        if (permission == LocationPermission.denied) {
          shouldRequestPermission = await showDialog(
            context: context,
            builder: (context) => Theme(
              data: isDarkTheme ? immichDarkTheme : immichLightTheme,
              child: LocationPermissionDisabledDialog(),
            ),
          );
          if (shouldRequestPermission) {
            permission = await Geolocator.requestPermission();
          }
        }

        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          // Open app settings only if you did not request for permission before
          if (permission == LocationPermission.deniedForever &&
              !shouldRequestPermission) {
            await Geolocator.openAppSettings();
          }
          return;
        }

        Position currentUserLocation = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 5),
        );

        forceAssetUpdate = true;
        mapController.move(
          LatLng(currentUserLocation.latitude, currentUserLocation.longitude),
          12,
        );
      } catch (error) {
        log.severe(
          "Cannot get user's current location due to ${error.toString()}",
        );
        if (context.mounted) {
          ImmichToast.show(
            context: context,
            gravity: ToastGravity.BOTTOM,
            toastType: ToastType.error,
            msg: "map_cannot_get_user_location".tr(),
          );
        }
      }
    }

    void handleBottomSheetEvents(dynamic event) {
      if (event is MapPageBottomSheetScrolled) {
        final assetInBottomSheet = event.asset;
        if (assetInBottomSheet != null) {
          final mapMarker = mapMarkerData.value
              .firstWhereOrNull((e) => e.asset.id == assetInBottomSheet.id);
          closestAssetMarker.value = mapMarker;
          if (mapMarker != null && mapController.zoom >= 5) {
            LatLng? newCenter = mapController.centerBoundsWithPadding(
              mapMarker.point,
              const Offset(0, -120),
            );
            if (newCenter != null) {
              mapController.move(
                newCenter,
                mapController.zoom,
              );
            }
          }
        }
      } else if (event is MapPageZoomToAsset) {
        onZoomToAssetEvent(event.asset);
      } else if (event is MapPageZoomToLocation) {
        onZoomToLocation();
      }
    }

    useEffect(
      () {
        final bottomSheetEventSubscription =
            bottomSheetEventStream.listen(handleBottomSheetEvents);
        return bottomSheetEventSubscription.cancel;
      },
      [bottomSheetEventStream],
    );

    void handleMapTapEvent(LatLng tapPosition) {
      const d = Distance();
      final assetsInBoundsList = assetsInBounds.toList();
      assetsInBoundsList.sort(
        (a, b) => d
            .distance(a.point, tapPosition)
            .compareTo(d.distance(b.point, tapPosition)),
      );
      // First asset less than the threshold from the tap point
      final nearestAsset = assetsInBoundsList.firstWhereOrNull(
        (element) =>
            d.distance(element.point, tapPosition) <
            mapController.getTapThresholdForZoomLevel(),
      );
      // Reset marker if no assets are near the tap point
      if (nearestAsset == null && closestAssetMarker.value != null) {
        selectionEnabledHook.value = false;
        mapPageEventSC.add(
          const MapPageOnTapEvent(),
        );
      }
      closestAssetMarker.value = nearestAsset;
    }

    void onMapEvent(MapEvent mapEvent) {
      if (mapEvent is MapEventMove || mapEvent is MapEventDoubleTapZoom) {
        if (forceAssetUpdate ||
            mapEvent.source != MapEventSource.mapController) {
          debounce(() {
            if (selectionEnabledHook.value) {
              selectionEnabledHook.value = false;
            }
            reloadAssetsInBound(
              mapMarkerData.value,
              forceReload: forceAssetUpdate,
            );
            forceAssetUpdate = false;
          });
        }
      } else if (mapEvent is MapEventTap) {
        handleMapTapEvent(mapEvent.tapPosition);
      }
    }

    void onShareAsset() {
      handleShareAssets(ref, context, selectedAssets.value.toList());
      selectionEnabledHook.value = false;
    }

    void onFavoriteAsset() async {
      showLoadingIndicator.value = true;
      try {
        await handleFavoriteAssets(ref, context, selectedAssets.value.toList());
      } finally {
        showLoadingIndicator.value = false;
        selectionEnabledHook.value = false;
        refetchMarkers.value = true;
      }
    }

    void onArchiveAsset() async {
      showLoadingIndicator.value = true;
      try {
        await handleArchiveAssets(ref, context, selectedAssets.value.toList());
      } finally {
        showLoadingIndicator.value = false;
        selectionEnabledHook.value = false;
        refetchMarkers.value = true;
      }
    }

    void selectionListener(bool isMultiSelect, Set<Asset> selection) {
      selectionEnabledHook.value = isMultiSelect;
      selectedAssets.value = selection;
    }

    final tileLayer = TileLayer(
      urlTemplate: ref.watch(
        serverInfoProvider.select((v) => v.serverConfig.mapTileUrl),
      ),
      maxNativeZoom: 19,
      maxZoom: 19,
    );

    final darkTileLayer = InvertionFilter(
      child: SaturationFilter(
        saturation: -1,
        child: BrightnessFilter(
          brightness: -1,
          child: tileLayer,
        ),
      ),
    );

    final markerLayer = MarkerLayer(
      markers: [
        if (closestAssetMarker.value != null)
          AssetMarker(
            remoteId: closestAssetMarker.value!.asset.remoteId!,
            anchorPos: AnchorPos.align(AnchorAlign.top),
            point: closestAssetMarker.value!.point,
            width: 100,
            height: 100,
            builder: (ctx) => GestureDetector(
              onTap: () => openAssetInViewer(closestAssetMarker.value!.asset),
              child: AssetMarkerIcon(
                key: Key(closestAssetMarker.value!.asset.remoteId!),
                isDarkTheme: isDarkTheme,
                id: closestAssetMarker.value!.asset.remoteId!,
              ),
            ),
          ),
      ],
    );

    final heatMapLayer = mapMarkerData.value.isNotEmpty
        ? HeatMapLayer(
            heatMapDataSource: InMemoryHeatMapDataSource(
              data: mapMarkerData.value
                  .map(
                    (e) => WeightedLatLng(
                      LatLng(e.point.latitude, e.point.longitude),
                      1,
                    ),
                  )
                  .toList(),
            ),
            heatMapOptions: HeatMapOptions(
              radius: 60,
              layerOpacity: 0.5,
              gradient: {
                0.20: Colors.deepPurple,
                0.40: Colors.blue,
                0.60: Colors.green,
                0.95: Colors.yellow,
                1.0: Colors.deepOrange,
              },
            ),
          )
        : const SizedBox.shrink();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle(
        statusBarColor:
            (isDarkTheme ? Colors.black : Colors.white).withOpacity(0.5),
        statusBarIconBrightness:
            isDarkTheme ? Brightness.light : Brightness.dark,
        systemNavigationBarColor:
            isDarkTheme ? Colors.grey[900] : Colors.grey[100],
        systemNavigationBarIconBrightness:
            isDarkTheme ? Brightness.light : Brightness.dark,
        systemNavigationBarDividerColor: Colors.transparent,
      ),
      child: Theme(
        // Override app theme based on map theme
        data: isDarkTheme ? immichDarkTheme : immichLightTheme,
        child: Scaffold(
          appBar: MapAppBar(
            isDarkTheme: isDarkTheme,
            selectionEnabled: selectionEnabledHook,
            selectedAssetsLength: selectedAssets.value.length,
            onShare: onShareAsset,
            onArchive: onArchiveAsset,
            onFavorite: onFavoriteAsset,
          ),
          extendBodyBehindAppBar: true,
          body: Stack(
            children: [
              FlutterMap(
                mapController: mapController,
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
                    mapController.mapEventStream.listen(onMapEvent);
                  },
                ),
                children: [
                  isDarkTheme ? darkTileLayer : tileLayer,
                  heatMapLayer,
                  markerLayer,
                ],
              ),
              MapPageBottomSheet(
                mapPageEventStream: mapPageEventSC.stream,
                bottomSheetEventSC: bottomSheetEventSC,
                selectionEnabled: selectionEnabledHook.value,
                selectionlistener: selectionListener,
                isDarkTheme: isDarkTheme,
              ),
              if (showLoadingIndicator.value)
                Positioned(
                  top: MediaQuery.of(context).size.height * 0.35,
                  left: MediaQuery.of(context).size.width * 0.425,
                  child: const ImmichLoadingIndicator(),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class AssetMarker extends Marker {
  String remoteId;

  AssetMarker({
    super.key,
    required this.remoteId,
    super.anchorPos,
    required super.point,
    super.width = 100.0,
    super.height = 100.0,
    required super.builder,
  });
}

import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/latlngbounds_extension.dart';
import 'package:immich_mobile/extensions/maplibrecontroller_extensions.dart';
import 'package:immich_mobile/models/map/map_event.model.dart' as app;
import 'package:immich_mobile/models/map/map_marker.model.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/providers/map/map_marker.provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:immich_mobile/utils/map_utils.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/map/asset_marker_icon.dart';
import 'package:immich_mobile/widgets/map/map_app_bar.dart';
import 'package:immich_mobile/widgets/map/map_asset_grid.dart';
import 'package:immich_mobile/widgets/map/map_bottom_sheet.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre/maplibre.dart';

@RoutePage()
class MapPage extends HookConsumerWidget {
  const MapPage({super.key, this.initialLocation});
  final Geographic? initialLocation;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mapController = useRef<MapController?>(null);
    final markers = useRef<List<MapMarker>>([]);
    final markersInBounds = useRef<List<MapMarker>>([]);
    final bottomSheetStreamController = useStreamController<app.MapEvent>();
    final selectedMarker = useValueNotifier<MapMarker?>(null);
    final assetsDebouncer = useDebouncer();
    final layerDebouncer = useDebouncer(interval: const Duration(seconds: 1));
    final isLoading = useProcessingOverlay();
    final scrollController = useScrollController();
    final markerDebouncer = useDebouncer(interval: const Duration(milliseconds: 800));
    final selectedAssets = useValueNotifier<Set<Asset>>({});
    const mapZoomToAssetLevel = 12.0;

    // updates the markersInBounds value with the map markers that are visible in the current
    // map camera bounds
    void updateAssetsInBounds() {
      if (mapController.value == null) return;

      final bounds = mapController.value!.getVisibleRegion();
      final inBounds = markers.value
          .where((m) => bounds.contains(Geographic(lat: m.latLng.lat, lon: m.latLng.lon)))
          .toList();

      // Notify bottom sheet to update asset grid only when there are new assets
      if (markersInBounds.value.length != inBounds.length) {
        bottomSheetStreamController.add(app.MapAssetsInBoundsUpdated(inBounds.map((e) => e.assetRemoteId).toList()));
      }
      markersInBounds.value = inBounds;
    }

    // removes all sources and layers and re-adds them with the updated markers
    Future<void> reloadLayers() async {
      if (mapController.value != null) {
        layerDebouncer.run(() => mapController.value!.reloadAllLayersForMarkers(markers.value));
      }
    }

    Future<void> loadMarkers() async {
      try {
        isLoading.value = true;
        markers.value = await ref.read(mapMarkersProvider.future);
        assetsDebouncer.run(updateAssetsInBounds);
        await reloadLayers();
      } finally {
        isLoading.value = false;
      }
    }

    useEffect(() {
      final currentAssetLink = ref.read(currentAssetProvider.notifier).ref.keepAlive();

      loadMarkers();
      return currentAssetLink.close;
    }, []);

    // Refetch markers when map state is changed
    ref.listen(mapStateNotifierProvider, (_, current) {
      if (!current.shouldRefetchMarkers) return;

      markerDebouncer.run(() {
        ref.invalidate(mapMarkersProvider);
        // Reset marker
        selectedMarker.value = null;
        loadMarkers();
        ref.read(mapStateNotifierProvider.notifier).setRefetchMarkers(false);
      });
    });

    void selectMarker(MapMarker marker) {
      selectedMarker.value = marker;
    }

    // finds the nearest asset marker from the tap point and store it as the selectedMarker
    void onMarkerClicked(Offset point) {
      if (mapController.value == null) return;

      final features = mapController.value!.featuresInRect(
        Rect.fromCircle(center: point, radius: 50),
        layerIds: [MapUtils.defaultHeatMapLayerId],
      );

      final featureId = features.firstOrNull?.id?.toString();

      final marker = featureId != null
          ? markersInBounds.value.firstWhereOrNull((m) => m.assetRemoteId == featureId)
          : null;

      if (marker != null) {
        selectMarker(marker);
        return;
      }

      if (selectedMarker.value == null) {
        // If no asset was previously selected and no new asset is available,
        // close the bottom sheet.
        bottomSheetStreamController.add(const app.MapCloseBottomSheet());
        return;
      }

      selectedMarker.value = null;
    }

    void onMapCreated(MapController controller) {
      mapController.value = controller;
    }

    void onMapEvent(MapEvent event) {
      switch (event) {
        case MapEventClick():
          onMarkerClicked(event.screenPoint);
        case MapEventCameraIdle():
          assetsDebouncer.run(updateAssetsInBounds);
        default:
      }
    }

    Future<void> onMarkerTapped() async {
      final assetId = selectedMarker.value?.assetRemoteId;
      if (assetId == null) {
        return;
      }

      final asset = await ref.read(dbProvider).assets.getByRemoteId(assetId);
      if (asset == null) {
        return;
      }

      // Since we only have a single asset, we can just show GroupAssetBy.none
      final renderList = await RenderList.fromAssets([asset], GroupAssetsBy.none);

      ref.read(currentAssetProvider.notifier).set(asset);
      if (asset.isVideo) {
        ref.read(showControlsProvider.notifier).show = false;
      }
      unawaited(context.pushRoute(GalleryViewerRoute(initialIndex: 0, heroOffset: 0, renderList: renderList)));
    }

    /// BOTTOM SHEET CALLBACKS

    void onBottomSheetScrolled(String assetRemoteId) {
      final assetMarker = markersInBounds.value.firstWhereOrNull((m) => m.assetRemoteId == assetRemoteId);
      if (assetMarker != null) {
        selectMarker(assetMarker);
      }
    }

    void onZoomToAsset(String assetRemoteId) {
      final assetMarker = markersInBounds.value.firstWhereOrNull((m) => m.assetRemoteId == assetRemoteId);
      if (mapController.value != null && assetMarker != null) {
        // Offset the latitude a little to show the marker just above the viewports center
        final offset = context.isMobile ? 0.02 : 0;
        final latlng = Geographic(lat: assetMarker.latLng.lat - offset, lon: assetMarker.latLng.lon);
        mapController.value!.animateCamera(
          center: latlng,
          zoom: mapZoomToAssetLevel,
          nativeDuration: Durations.extralong2,
        );
      }
    }

    void onZoomToLocation() async {
      final (location, error) = await MapUtils.checkPermAndGetLocation(context: context);
      if (error != null) {
        if (error == LocationPermission.unableToDetermine && context.mounted) {
          ImmichToast.show(
            context: context,
            gravity: ToastGravity.BOTTOM,
            toastType: ToastType.error,
            msg: "map_cannot_get_user_location".tr(),
          );
        }
        return;
      }

      if (mapController.value != null && location != null) {
        await mapController.value!.animateCamera(
          center: Geographic(lat: location.latitude, lon: location.longitude),
          zoom: mapZoomToAssetLevel,
          nativeDuration: Durations.extralong2,
        );
      }
    }

    void onAssetsSelected(bool selected, Set<Asset> selection) {
      selectedAssets.value = selected ? selection : {};
    }

    return MapThemeOverride(
      mapBuilder: (style) => context.isMobile
          // Single-column
          ? Scaffold(
              extendBodyBehindAppBar: true,
              appBar: MapAppBar(selectedAssets: selectedAssets),
              body: Stack(
                children: [
                  _MapWithMarker(
                    initialLocation: initialLocation,
                    style: style,
                    selectedMarker: selectedMarker,
                    onMapCreated: onMapCreated,
                    onMapEvent: onMapEvent,
                    onStyleLoaded: (_) => reloadLayers(),
                    onMarkerTapped: onMarkerTapped,
                  ),
                  // Should be a part of the body and not scaffold::bottomsheet for the
                  // location button to be hit testable
                  MapBottomSheet(
                    mapEventStream: bottomSheetStreamController.stream,
                    onGridAssetChanged: onBottomSheetScrolled,
                    onZoomToAsset: onZoomToAsset,
                    onAssetsSelected: onAssetsSelected,
                    onZoomToLocation: onZoomToLocation,
                    selectedAssets: selectedAssets,
                  ),
                ],
              ),
            )
          // Two-pane
          : Row(
              children: [
                Expanded(
                  child: Scaffold(
                    extendBodyBehindAppBar: true,
                    appBar: MapAppBar(selectedAssets: selectedAssets),
                    body: Stack(
                      children: [
                        _MapWithMarker(
                          initialLocation: initialLocation,
                          style: style,
                          selectedMarker: selectedMarker,
                          onMapCreated: onMapCreated,
                          onMapEvent: onMapEvent,
                          onStyleLoaded: (_) => reloadLayers(),
                          onMarkerTapped: onMarkerTapped,
                        ),
                        Positioned(
                          right: 0,
                          bottom: context.padding.bottom + 16,
                          child: ElevatedButton(
                            onPressed: onZoomToLocation,
                            style: ElevatedButton.styleFrom(shape: const CircleBorder()),
                            child: const Icon(Icons.my_location),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(
                    builder: (ctx, constraints) => MapAssetGrid(
                      controller: scrollController,
                      mapEventStream: bottomSheetStreamController.stream,
                      onGridAssetChanged: onBottomSheetScrolled,
                      onZoomToAsset: onZoomToAsset,
                      onAssetsSelected: onAssetsSelected,
                      selectedAssets: selectedAssets,
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}

class _MapWithMarker extends StatelessWidget {
  final AsyncValue<String> style;
  final void Function(MapController) onMapCreated;
  final void Function(MapEvent) onMapEvent;
  final void Function(StyleController) onStyleLoaded;
  final Function()? onMarkerTapped;
  final ValueNotifier<MapMarker?> selectedMarker;
  final Geographic? initialLocation;

  const _MapWithMarker({
    required this.style,
    required this.onMapCreated,
    required this.onMapEvent,
    required this.onStyleLoaded,
    required this.selectedMarker,
    this.onMarkerTapped,
    this.initialLocation,
  });

  @override
  Widget build(BuildContext context) {
    return style.widgetWhen(
      onData: (style) => MapLibreMap(
        options: MapOptions(
          initCenter: initialLocation ?? const Geographic(lat: 0, lon: 0),
          initZoom: initialLocation != null ? 12 : 0,
          initStyle: style,
          gestures: const MapGestures.all(pitch: false, rotate: false),
        ),
        onMapCreated: onMapCreated,
        onStyleLoaded: onStyleLoaded,
        onEvent: onMapEvent,
        children: [
          ValueListenableBuilder<MapMarker?>(
            valueListenable: selectedMarker,
            builder: (ctx, marker, _) => marker != null
                ? WidgetLayer(
                    markers: [
                      Marker(
                        point: marker.latLng,
                        size: const Size(100, 100),
                        alignment: Alignment.bottomCenter,
                        child: GestureDetector(
                          onTap: () => onMarkerTapped?.call(),
                          child: SizedBox.square(
                            dimension: 100,
                            child: AssetMarkerIcon(
                              id: marker.assetRemoteId,
                              thumbhash: '',
                              key: Key(marker.assetRemoteId),
                            ),
                          ),
                        ),
                      ),
                    ],
                  )
                : const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }
}

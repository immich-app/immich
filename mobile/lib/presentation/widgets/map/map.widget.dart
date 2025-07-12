import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/map_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/map/map_utils.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class DriftMapWithMarker extends ConsumerStatefulWidget {
  const DriftMapWithMarker({super.key});

  @override
  ConsumerState<DriftMapWithMarker> createState() => _DriftMapWithMarkerState();
}

class _DriftMapWithMarkerState extends ConsumerState<DriftMapWithMarker> {
  MapLibreMapController? mapController;
  static const mapZoomToAssetLevel = 12.0;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> onMapCreated(MapLibreMapController controller) async {
    mapController = controller;
    await setBounds();
  }

  Future<void> onMapMoved() async {
    await setBounds();
  }

  Future<void> setBounds() async {
    if (mapController == null) return;
    final bounds = await mapController!.getVisibleRegion();
    ref.watch(mapStateProvider.notifier).setBounds(bounds);
  }

  Future<void> reloadMarkers(Map<String, dynamic> markers) async {
    if (mapController == null) return;

    // Wait for previous reload to complete
    if (!MapUtils.completer.isCompleted) {
      return MapUtils.completer.future;
    }
    MapUtils.completer = Completer();

    // !! Make sure to remove layers before sources else the native
    // maplibre library would crash when removing the source saying that
    // the source is still in use
    final existingLayers = await mapController!.getLayerIds();
    if (existingLayers.contains(MapUtils.defaultHeatMapLayerId)) {
      await mapController!.removeLayer(MapUtils.defaultHeatMapLayerId);
    }

    final existingSources = await mapController!.getSourceIds();
    if (existingSources.contains(MapUtils.defaultSourceId)) {
      await mapController!.removeSource(MapUtils.defaultSourceId);
    }

    await mapController!.addSource(MapUtils.defaultSourceId, GeojsonSourceProperties(data: markers));

    if (Platform.isAndroid) {
      await mapController!.addCircleLayer(
        MapUtils.defaultSourceId,
        MapUtils.defaultHeatMapLayerId,
        const CircleLayerProperties(
          circleRadius: 10,
          circleColor: "rgba(150,86,34,0.7)",
          circleBlur: 1.0,
          circleOpacity: 0.7,
          circleStrokeWidth: 0.1,
          circleStrokeColor: "rgba(203,46,19,0.5)",
          circleStrokeOpacity: 0.7,
        ),
      );
    } else if (Platform.isIOS) {
      await mapController!.addHeatmapLayer(
        MapUtils.defaultSourceId,
        MapUtils.defaultHeatMapLayerId,
        MapUtils.defaultHeatMapLayerProperties,
      );
    }

    MapUtils.completer.complete();
  }

  Future<void> onZoomToLocation() async {
    final (location, error) =
        await MapUtils.checkPermAndGetLocation(context: context);
    if (error != null) {
      if (error == LocationPermission.unableToDetermine && context.mounted) {
        ImmichToast.show(
          context: context,
          gravity: ToastGravity.BOTTOM,
          toastType: ToastType.error,
          msg: "map_cannot_get_user_location".t(context: context),
        );
      }
      return;
    }

    if (mapController != null && location != null) {
      mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(location.latitude, location.longitude),
          mapZoomToAssetLevel,
        ),
        duration: const Duration(milliseconds: 800),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _Map(
          onMapCreated: onMapCreated,
          onMapMoved: onMapMoved,
        ),
        _MyLocationButton(onZoomToLocation: onZoomToLocation),
        _Markers(
          reloadMarkers: reloadMarkers,
        ),
      ],
    );
  }
}

class _Map extends StatelessWidget {
  const _Map({
    required this.onMapCreated,
    required this.onMapMoved,
  });

  final MapCreatedCallback onMapCreated;
  final OnCameraIdleCallback onMapMoved;

  @override
  Widget build(BuildContext context) {
    return MapThemeOverride(
      mapBuilder: (style) =>
        style.widgetWhen(onData: (style) =>
          MapLibreMap(
            initialCameraPosition: const CameraPosition(
              target: LatLng(0, 0),
              zoom: 0,
            ),
            styleString: style,
            onMapCreated: onMapCreated,
            onCameraIdle: onMapMoved,
          ),
        ),
    );
  }
}

class _Markers extends ConsumerWidget {
  const _Markers({required this.reloadMarkers});

  final Function(Map<String, dynamic>) reloadMarkers;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final initBounds = ref.watch(mapStateProvider.select((s) => s.bounds));
    AsyncValue<Map<String, dynamic>> markers = ref.watch(mapMarkerProvider(initBounds));
    AsyncValue<List<String>> assetIds = ref.watch(mapAssetsProvider(initBounds));

    ref.listen(mapStateProvider, (previous, next) async {
      markers = ref.watch(mapMarkerProvider(next.bounds));
      assetIds = ref.watch(mapAssetsProvider(next.bounds));
    });

    markers.whenData((markers) => reloadMarkers(markers));

    return assetIds.widgetWhen(
      onData: (assetIds) {
        return MapBottomSheet(assetIds: assetIds);
      },
    );
  }
}

class _MyLocationButton extends StatelessWidget {
  const _MyLocationButton({required this.onZoomToLocation});

  final VoidCallback onZoomToLocation;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      right: 0,
      bottom: context.padding.bottom + 16,
      child: ElevatedButton(
        onPressed: onZoomToLocation,
        style: ElevatedButton.styleFrom(
          shape: const CircleBorder(),
        ),
        child: const Icon(Icons.my_location),
      ),
    );
  }
}

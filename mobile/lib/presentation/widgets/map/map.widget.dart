import 'dart:async';

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
import 'package:immich_mobile/utils/async_mutex.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class CustomSourceProperties implements SourceProperties {
  final Map<String, dynamic> data;
  const CustomSourceProperties({required this.data});

  @override
  Map<String, dynamic> toJson() {
    return {
      "type": "geojson",
      "data": data,
      // "cluster": true,
      // "clusterRadius": 1,
      // "clusterMinPoints": 5,
      // "tolerance": 0.1,
    };
  }
}

class DriftMap extends ConsumerStatefulWidget {
  final LatLng? initialLocation;

  const DriftMap({super.key, this.initialLocation});

  @override
  ConsumerState<DriftMap> createState() => _DriftMapState();
}

class _DriftMapState extends ConsumerState<DriftMap> {
  MapLibreMapController? mapController;
  final _reloadMutex = AsyncMutex();
  final _debouncer = Debouncer(interval: const Duration(milliseconds: 500), maxWaitTime: const Duration(seconds: 2));

  @override
  void dispose() {
    _debouncer.dispose();
    super.dispose();
  }

  void onMapCreated(MapLibreMapController controller) {
    mapController = controller;
  }

  Future<void> onMapReady() async {
    final controller = mapController;
    if (controller == null) {
      return;
    }

    await controller.addSource(
      MapUtils.defaultSourceId,
      const CustomSourceProperties(data: {'type': 'FeatureCollection', 'features': []}),
    );

    await controller.addHeatmapLayer(
      MapUtils.defaultSourceId,
      MapUtils.defaultHeatMapLayerId,
      MapUtils.defaultHeatmapLayerProperties,
    );
    _debouncer.run(setBounds);
    controller.addListener(onMapMoved);
  }

  void onMapMoved() {
    if (mapController!.isCameraMoving || !mounted) {
      return;
    }

    _debouncer.run(setBounds);
  }

  Future<void> setBounds() async {
    final controller = mapController;
    if (controller == null || !mounted) {
      return;
    }

    final bounds = await controller.getVisibleRegion();
    _reloadMutex.run(() async {
      if (mounted && ref.read(mapStateProvider.notifier).setBounds(bounds)) {
        final markers = await ref.read(mapMarkerProvider(bounds).future);
        await reloadMarkers(markers);
      }
    });
  }

  Future<void> reloadMarkers(Map<String, dynamic> markers) async {
    final controller = mapController;
    if (controller == null || !mounted) {
      return;
    }

    await controller.setGeoJsonSource(MapUtils.defaultSourceId, markers);
  }

  Future<void> onZoomToLocation() async {
    final (location, error) = await MapUtils.checkPermAndGetLocation(context: context);
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

    final controller = mapController;
    if (controller != null && location != null) {
      controller.animateCamera(
        CameraUpdate.newLatLngZoom(LatLng(location.latitude, location.longitude), MapUtils.mapZoomToAssetLevel),
        duration: const Duration(milliseconds: 800),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _Map(initialLocation: widget.initialLocation, onMapCreated: onMapCreated, onMapReady: onMapReady),
        _MyLocationButton(onZoomToLocation: onZoomToLocation),
        const MapBottomSheet(),
      ],
    );
  }
}

class _Map extends StatelessWidget {
  final LatLng? initialLocation;

  const _Map({this.initialLocation, required this.onMapCreated, required this.onMapReady});

  final MapCreatedCallback onMapCreated;

  final VoidCallback onMapReady;

  @override
  Widget build(BuildContext context) {
    final initialLocation = this.initialLocation;
    return MapThemeOverride(
      mapBuilder: (style) => style.widgetWhen(
        onData: (style) => MapLibreMap(
          initialCameraPosition: initialLocation == null
              ? const CameraPosition(target: LatLng(0, 0), zoom: 0)
              : CameraPosition(target: initialLocation, zoom: MapUtils.mapZoomToAssetLevel),
          styleString: style,
          onMapCreated: onMapCreated,
          onStyleLoadedCallback: onMapReady,
        ),
      ),
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
        style: ElevatedButton.styleFrom(shape: const CircleBorder()),
        child: const Icon(Icons.my_location),
      ),
    );
  }
}

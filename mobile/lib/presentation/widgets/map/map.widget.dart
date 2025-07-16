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

class DriftMap extends ConsumerStatefulWidget {
  const DriftMap({super.key});

  @override
  ConsumerState<DriftMap> createState() => _DriftMapState();
}

class _DriftMapState extends ConsumerState<DriftMap> {
  MapLibreMapController? mapController;
  bool loadAllMarkers = false;

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
    ref.read(mapStateProvider.notifier).setBounds(bounds);
  }

  Future<void> reloadMarkers(
    Map<String, dynamic> markers, {
    bool isLoadAllMarkers = false,
  }) async {
    if (mapController == null || loadAllMarkers) return;

    // Wait for previous reload to complete
    if (!MapUtils.markerCompleter.isCompleted) {
      return MapUtils.markerCompleter.future;
    }
    MapUtils.markerCompleter = Completer();

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

    await mapController!.addSource(
      MapUtils.defaultSourceId,
      GeojsonSourceProperties(data: markers),
    );

    if (Platform.isAndroid) {
      await mapController!.addCircleLayer(
        MapUtils.defaultSourceId,
        MapUtils.defaultHeatMapLayerId,
        MapUtils.defaultCircleLayerLayerProperties,
      );
    } else if (Platform.isIOS) {
      await mapController!.addHeatmapLayer(
        MapUtils.defaultSourceId,
        MapUtils.defaultHeatMapLayerId,
        MapUtils.defaultHeatmapLayerProperties,
      );
    }

    if (isLoadAllMarkers) loadAllMarkers = true;

    MapUtils.markerCompleter.complete();
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
          MapUtils.mapZoomToAssetLevel,
        ),
        duration: const Duration(milliseconds: 800),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final bounds = ref.watch(mapStateProvider.select((s) => s.bounds));
    AsyncValue<Map<String, dynamic>> markers =
        ref.watch(mapMarkerProvider(bounds));
    AsyncValue<Map<String, dynamic>> allMarkers =
        ref.watch(mapMarkerProvider(null));

    ref.listen(mapStateProvider, (previous, next) async {
      markers = ref.watch(mapMarkerProvider(bounds));
    });

    markers.whenData((markers) => reloadMarkers(markers));
    allMarkers
        .whenData((markers) => reloadMarkers(markers, isLoadAllMarkers: true));

    return Stack(
      children: [
        _Map(
          onMapCreated: onMapCreated,
          onMapMoved: onMapMoved,
        ),
        _MyLocationButton(onZoomToLocation: onZoomToLocation),
        const MapBottomSheet(),
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
      mapBuilder: (style) => style.widgetWhen(
        onData: (style) => MapLibreMap(
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

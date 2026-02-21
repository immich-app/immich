import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:geolocator/geolocator.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/map_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/presentation/widgets/map/map_utils.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/async_mutex.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre/maplibre.dart';

class DriftMap extends ConsumerStatefulWidget {
  final Geographic? initialLocation;

  const DriftMap({super.key, this.initialLocation});

  @override
  ConsumerState<DriftMap> createState() => _DriftMapState();
}

class _DriftMapState extends ConsumerState<DriftMap> {
  MapController? mapController;
  final _reloadMutex = AsyncMutex();
  final _debouncer = Debouncer(interval: const Duration(milliseconds: 500), maxWaitTime: const Duration(seconds: 2));
  final ValueNotifier<double> bottomSheetOffset = ValueNotifier(0.25);
  StreamSubscription? _eventSubscription;

  @override
  void initState() {
    super.initState();
    _eventSubscription = EventStream.shared.listen<MapMarkerReloadEvent>(_onEvent);
  }

  @override
  void dispose() {
    _debouncer.dispose();
    bottomSheetOffset.dispose();
    _eventSubscription?.cancel();
    super.dispose();
  }

  void onMapCreated(MapController controller) {
    mapController = controller;
  }

  void _onEvent(_) => _debouncer.run(() => setBounds(forceReload: true));

  Future<void> onMapReady() async {
    final controller = mapController;
    if (controller == null) {
      return;
    }

    await controller.style!.addSource(
      GeoJsonSource(id: MapUtils.defaultSourceId, data: jsonEncode({'type': 'FeatureCollection', 'features': []})),
    );

    await controller.style!.addLayer(
      const HeatmapStyleLayer(
        id: MapUtils.defaultHeatMapLayerId,
        sourceId: MapUtils.defaultSourceId,
        paint: MapUtils.defaultHeatmapLayerPaint,
      ),
    );

    _debouncer.run(() => setBounds(forceReload: true));
  }

  void onMapEvent(MapEvent event) {
    if (event is! MapEventCameraIdle || !mounted) return;

    _debouncer.run(setBounds);
  }

  Future<void> setBounds({bool forceReload = false}) async {
    final controller = mapController;
    if (controller == null || !mounted) {
      return;
    }

    // When the AssetViewer is open, the DriftMap route stays alive in the background.
    // If we continue to update bounds, the map-scoped timeline service gets recreated and the previous one disposed,
    // which can invalidate the TimelineService instance that was passed into AssetViewerRoute (causing "loading forever").
    final currentRoute = ref.read(currentRouteNameProvider);
    if (currentRoute == AssetViewerRoute.name || currentRoute == GalleryViewerRoute.name) {
      return;
    }

    final bounds = controller.getVisibleRegion();
    unawaited(
      _reloadMutex.run(() async {
        if (mounted && (ref.read(mapStateProvider.notifier).setBounds(bounds) || forceReload)) {
          final markers = await ref.read(mapMarkerProvider(bounds).future);
          await reloadMarkers(markers);
        }
      }),
    );
  }

  Future<void> reloadMarkers(Map<String, dynamic> markers) async {
    final controller = mapController;
    if (controller == null || !mounted) {
      return;
    }

    await controller.style!.updateGeoJsonSource(id: MapUtils.defaultSourceId, data: jsonEncode(markers));
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
      await controller.animateCamera(
        center: Geographic(lat: location.latitude, lon: location.longitude),
        zoom: MapUtils.mapZoomToAssetLevel,
        nativeDuration: Durations.extralong2,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        _Map(
          initialLocation: widget.initialLocation,
          onMapCreated: onMapCreated,
          onMapReady: onMapReady,
          onMapEvent: onMapEvent,
        ),
        _DynamicBottomSheet(bottomSheetOffset: bottomSheetOffset),
        _DynamicMyLocationButton(onZoomToLocation: onZoomToLocation, bottomSheetOffset: bottomSheetOffset),
      ],
    );
  }
}

class _Map extends StatelessWidget {
  final Geographic? initialLocation;

  const _Map({this.initialLocation, required this.onMapCreated, required this.onMapReady, required this.onMapEvent});

  final void Function(MapController) onMapCreated;
  final VoidCallback onMapReady;
  final void Function(MapEvent) onMapEvent;

  @override
  Widget build(BuildContext context) {
    final initialLocation = this.initialLocation;
    return MapThemeOverride(
      mapBuilder: (style) => style.widgetWhen(
        onData: (style) => MapLibreMap(
          options: MapOptions(
            initCenter: initialLocation ?? const Geographic(lat: 0, lon: 0),
            initZoom: initialLocation == null ? 0 : MapUtils.mapZoomToAssetLevel,
            initStyle: style,
            gestures: const MapGestures.all(rotate: false),
          ),
          onMapCreated: onMapCreated,
          onStyleLoaded: (_) => onMapReady(),
          onEvent: onMapEvent,
        ),
      ),
    );
  }
}

class _DynamicBottomSheet extends StatefulWidget {
  final ValueNotifier<double> bottomSheetOffset;

  const _DynamicBottomSheet({required this.bottomSheetOffset});

  @override
  State<_DynamicBottomSheet> createState() => _DynamicBottomSheetState();
}

class _DynamicBottomSheetState extends State<_DynamicBottomSheet> {
  @override
  Widget build(BuildContext context) {
    return NotificationListener<DraggableScrollableNotification>(
      onNotification: (notification) {
        widget.bottomSheetOffset.value = notification.extent;
        return true;
      },
      child: const MapBottomSheet(),
    );
  }
}

class _DynamicMyLocationButton extends StatelessWidget {
  const _DynamicMyLocationButton({required this.onZoomToLocation, required this.bottomSheetOffset});

  final VoidCallback onZoomToLocation;
  final ValueNotifier<double> bottomSheetOffset;

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<double>(
      valueListenable: bottomSheetOffset,
      builder: (context, offset, child) {
        return Positioned(
          right: 20,
          bottom: context.height * (offset - 0.02) + context.padding.bottom,
          child: AnimatedOpacity(
            opacity: offset < 0.8 ? 1 : 0,
            duration: const Duration(milliseconds: 150),
            child: ElevatedButton(
              onPressed: onZoomToLocation,
              style: ElevatedButton.styleFrom(shape: const CircleBorder()),
              child: const Icon(Icons.my_location),
            ),
          ),
        );
      },
    );
  }
}

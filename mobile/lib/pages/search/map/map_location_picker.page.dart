import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/utils/map_utils.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre/maplibre.dart';

@RoutePage()
class MapLocationPickerPage extends HookConsumerWidget {
  final Geographic initialLatLng;

  const MapLocationPickerPage({super.key, this.initialLatLng = const Geographic(lat: 0, lon: 0)});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLatLng = useValueNotifier<Geographic>(initialLatLng);
    final currentLatLng = useValueListenable(selectedLatLng);
    final controller = useRef<MapController?>(null);

    Future<void> onStyleLoaded(StyleController style) async {
      await style.addImageFromAssets(id: 'mapMarker', asset: 'assets/location-pin.png');
    }

    void onEvent(MapEvent event) {
      if (event is! MapEventClick) return;

      selectedLatLng.value = event.point;
      controller.value?.animateCamera(center: event.point);
    }

    void onClose([Geographic? selected]) {
      context.maybePop(selected);
    }

    Future<void> getCurrentLocation() async {
      var (currentLocation, _) = await MapUtils.checkPermAndGetLocation(context: context);

      if (currentLocation == null) {
        return;
      }

      var currentLatLng = Geographic(lat: currentLocation.latitude, lon: currentLocation.longitude);
      selectedLatLng.value = currentLatLng;
      await controller.value?.animateCamera(center: currentLatLng, zoom: 12);
    }

    return MapThemeOverride(
      mapBuilder: (style) => Builder(
        builder: (ctx) => Scaffold(
          backgroundColor: ctx.themeData.cardColor,
          appBar: _AppBar(onClose: onClose),
          extendBodyBehindAppBar: true,
          primary: true,
          body: style.widgetWhen(
            onData: (style) => Container(
              clipBehavior: Clip.antiAliasWithSaveLayer,
              decoration: const BoxDecoration(
                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
              ),
              child: MapLibreMap(
                options: MapOptions(
                  initCenter: initialLatLng,
                  initZoom: (initialLatLng.lat == 0 && initialLatLng.lon == 0) ? 1 : 12,
                  initStyle: style,
                  gestures: const MapGestures.all(pitch: false),
                ),
                onMapCreated: (mapController) => controller.value = mapController,
                onStyleLoaded: onStyleLoaded,
                onEvent: onEvent,
                layers: [
                  MarkerLayer(
                    points: [Feature(geometry: Point(currentLatLng))],
                    iconImage: 'mapMarker',
                    iconSize: 0.15,
                    iconAnchor: IconAnchor.bottom,
                    iconAllowOverlap: true,
                  ),
                ],
              ),
            ),
          ),
          bottomNavigationBar: _BottomBar(
            selectedLatLng: selectedLatLng,
            onUseLocation: () => onClose(selectedLatLng.value),
            onGetCurrentLocation: getCurrentLocation,
          ),
        ),
      ),
    );
  }
}

class _AppBar extends StatelessWidget implements PreferredSizeWidget {
  final Function() onClose;

  const _AppBar({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 25),
      child: Align(
        alignment: Alignment.centerLeft,
        child: ElevatedButton(
          onPressed: onClose,
          style: ElevatedButton.styleFrom(shape: const CircleBorder()),
          child: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100);
}

class _BottomBar extends StatelessWidget {
  final ValueNotifier<Geographic> selectedLatLng;
  final Function() onUseLocation;
  final Function() onGetCurrentLocation;

  const _BottomBar({required this.selectedLatLng, required this.onUseLocation, required this.onGetCurrentLocation});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 150 + context.padding.bottom,
      child: Padding(
        padding: EdgeInsets.only(bottom: context.padding.bottom),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.public, size: 18),
                const SizedBox(width: 15),
                ValueListenableBuilder(
                  valueListenable: selectedLatLng,
                  builder: (_, value, __) => Text("${value.lat.toStringAsFixed(4)}, ${value.lon.toStringAsFixed(4)}"),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: onUseLocation,
                  child: const Text("map_location_picker_page_use_location").tr(),
                ),
                ElevatedButton(onPressed: onGetCurrentLocation, child: const Icon(Icons.my_location)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

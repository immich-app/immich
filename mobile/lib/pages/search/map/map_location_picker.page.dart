import 'dart:math';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/maplibrecontroller_extensions.dart';
import 'package:immich_mobile/widgets/map/map_theme_override.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:immich_mobile/utils/map_utils.dart';

@RoutePage<LatLng?>()
class MapLocationPickerPage extends HookConsumerWidget {
  final LatLng initialLatLng;

  const MapLocationPickerPage({
    super.key,
    this.initialLatLng = const LatLng(0, 0),
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLatLng = useValueNotifier<LatLng>(initialLatLng);
    final controller = useRef<MaplibreMapController?>(null);
    final marker = useRef<Symbol?>(null);

    Future<void> onStyleLoaded() async {
      marker.value = await controller.value?.addMarkerAtLatLng(initialLatLng);
    }

    Future<void> onMapClick(Point<num> point, LatLng centre) async {
      selectedLatLng.value = centre;
      controller.value?.animateCamera(CameraUpdate.newLatLng(centre));
      if (marker.value != null) {
        await controller.value
            ?.updateSymbol(marker.value!, SymbolOptions(geometry: centre));
      }
    }

    void onClose([LatLng? selected]) {
      context.maybePop(selected);
    }

    Future<void> getCurrentLocation() async {
      var (currentLocation, _) =
          await MapUtils.checkPermAndGetLocation(context);

      if (currentLocation == null) {
        return;
      }

      var currentLatLng =
          LatLng(currentLocation.latitude, currentLocation.longitude);
      selectedLatLng.value = currentLatLng;
      controller.value?.animateCamera(CameraUpdate.newLatLng(currentLatLng));
    }

    return MapThemeOveride(
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
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
              ),
              child: MaplibreMap(
                initialCameraPosition:
                    CameraPosition(target: initialLatLng, zoom: 12),
                styleString: style,
                onMapCreated: (mapController) =>
                    controller.value = mapController,
                onStyleLoadedCallback: onStyleLoaded,
                onMapClick: onMapClick,
                dragEnabled: false,
                tiltGesturesEnabled: false,
                myLocationEnabled: false,
                attributionButtonMargins: const Point(20, 15),
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
          style: ElevatedButton.styleFrom(
            shape: const CircleBorder(),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(100);
}

class _BottomBar extends StatelessWidget {
  final ValueNotifier<LatLng> selectedLatLng;
  final Function() onUseLocation;
  final Function() onGetCurrentLocation;

  const _BottomBar({
    required this.selectedLatLng,
    required this.onUseLocation,
    required this.onGetCurrentLocation,
  });

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
                  builder: (_, value, __) => Text(
                    "${value.latitude.toStringAsFixed(4)}, ${value.longitude.toStringAsFixed(4)}",
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: onUseLocation,
                  child:
                      const Text("map_location_picker_page_use_location").tr(),
                ),
                ElevatedButton(
                  onPressed: onGetCurrentLocation,
                  child: const Icon(Icons.my_location),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

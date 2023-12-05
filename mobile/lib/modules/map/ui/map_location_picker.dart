import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/shared/ui/immich_loading_indicator.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:latlong2/latlong.dart';

class MapLocationPickerPage extends HookConsumerWidget {
  final LatLng? initialLatLng;

  const MapLocationPickerPage({super.key, this.initialLatLng});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLatLng = useState<LatLng>(initialLatLng ?? LatLng(0, 0));
    final isDarkTheme =
        ref.watch(mapStateNotifier.select((state) => state.isDarkTheme));
    final isLoading =
        ref.watch(mapStateNotifier.select((state) => state.isLoading));
    final maxZoom = ref.read(mapStateNotifier.notifier).maxZoom;

    return Theme(
      // Override app theme based on map theme
      data: isDarkTheme ? immichDarkTheme : immichLightTheme,
      child: Scaffold(
        extendBodyBehindAppBar: true,
        body: Stack(
          children: [
            if (!isLoading)
              FlutterMap(
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
                  maxZoom: maxZoom,
                  onTap: (tapPosition, point) => selectedLatLng.value = point,
                ),
                children: [
                  ref.read(mapStateNotifier.notifier).getTileLayer(),
                  MarkerLayer(
                    markers: [
                      Marker(
                        anchorPos: AnchorPos.align(AnchorAlign.top),
                        point: selectedLatLng.value,
                        builder: (ctx) => const Image(
                          image: AssetImage('assets/location-pin.png'),
                        ),
                        height: 40,
                        width: 40,
                      ),
                    ],
                  ),
                ],
              ),
            if (isLoading)
              Positioned(
                top: context.height * 0.35,
                left: context.width * 0.425,
                child: const ImmichLoadingIndicator(),
              ),
          ],
        ),
        bottomSheet: BottomSheet(
          onClosing: () {},
          builder: (context) => SizedBox(
            height: 150,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  "${selectedLatLng.value.latitude.toStringAsFixed(4)}, ${selectedLatLng.value.longitude.toStringAsFixed(4)}",
                  style: context.textTheme.bodyLarge?.copyWith(
                    color: context.primaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    ElevatedButton(
                      onPressed: () => context.autoPop(selectedLatLng.value),
                      child: const Text("map_location_picker_page_use_location")
                          .tr(),
                    ),
                    ElevatedButton(
                      onPressed: () => context.autoPop(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: context.colorScheme.error,
                      ),
                      child: const Text("action_common_cancel").tr(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

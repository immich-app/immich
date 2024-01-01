import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:latlong2/latlong.dart';

class MapLocationPickerPage extends HookConsumerWidget {
  final LatLng? initialLatLng;

  const MapLocationPickerPage({super.key, this.initialLatLng});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedLatLng = useState<LatLng>(initialLatLng ?? LatLng(0, 0));

    return Theme(
      data: context.themeData,
      child: Scaffold(
        extendBodyBehindAppBar: true,
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

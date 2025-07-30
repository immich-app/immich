import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

class MapBottomSheet extends ConsumerWidget {
  const MapBottomSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    LatLngBounds bounds = ref.watch(mapStateProvider.select((s) => s.bounds));

    return BaseBottomSheet(
      initialChildSize: 0.25,
      shouldCloseOnMinExtent: false,
      actions: const [],
      slivers: [
        SliverFillRemaining(
          child: ProviderScope(
            key: ObjectKey(bounds),
            overrides: [
              timelineServiceProvider.overrideWith((ref) {
                final timelineService = ref.watch(timelineFactoryProvider).map(bounds);
                ref.onDispose(timelineService.dispose);
                return timelineService;
              }),
            ],
            child: const Timeline(),
          ),
        ),
      ],
    );
  }
}

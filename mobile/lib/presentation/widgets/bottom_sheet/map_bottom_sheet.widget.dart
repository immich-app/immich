import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
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
      resizeOnScroll: false,
      actions: const [],
      backgroundColor: context.themeData.colorScheme.surface,
      slivers: [
        SliverFillRemaining(
          hasScrollBody: false,
          // TODO: rebuilding the entire timeline from scratch on bounds change is very inefficient
          child: ProviderScope(
            key: ObjectKey(bounds),
            overrides: [
              timelineServiceProvider.overrideWith((ref) {
                final timelineService = ref.watch(timelineFactoryProvider).map(bounds);
                ref.onDispose(timelineService.dispose);
                return timelineService;
              }),
            ],
            child: const Timeline(appBar: null, bottomSheet: null),
          ),
        ),
      ],
    );
  }
}

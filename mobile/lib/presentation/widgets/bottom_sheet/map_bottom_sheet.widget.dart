import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class MapBottomSheet extends StatelessWidget {
  const MapBottomSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return const BaseBottomSheet(
      initialChildSize: 0.25,
      maxChildSize: 0.9,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      actions: [],
      slivers: [SliverFillRemaining(hasScrollBody: false, child: _ScopedMapTimeline())],
    );
  }
}

class _ScopedMapTimeline extends StatelessWidget {
  const _ScopedMapTimeline();

  @override
  Widget build(BuildContext context) {
    // TODO: this causes the timeline to switch to flicker to "loading" state and back. This is both janky and inefficient.
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final bounds = ref.watch(mapStateProvider).bounds;
          final timelineService = ref.watch(timelineFactoryProvider).map(bounds);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: const Timeline(appBar: null, bottomSheet: null, withScrubber: false),
    );
  }
}

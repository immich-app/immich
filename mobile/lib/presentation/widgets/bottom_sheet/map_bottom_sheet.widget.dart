import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/map/map.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

class MapBottomSheet extends StatelessWidget {
  final Key? sheetKey;

  const MapBottomSheet({super.key, this.sheetKey});

  @override
  Widget build(BuildContext context) {
    return BaseBottomSheet(
      key: sheetKey,
      initialChildSize: 0.25,
      maxChildSize: 0.75,
      shouldCloseOnMinExtent: false,
      resizeOnScroll: false,
      actions: [],
      backgroundColor: context.themeData.colorScheme.surface,
      slivers: [const SliverFillRemaining(hasScrollBody: true, child: _ScopedMapTimeline())],
    );
  }
}

final _mapAssetCountProvider = StreamProvider.autoDispose<int>((ref) {
  final service = ref.watch(timelineServiceProvider);
  return service.watchBuckets().map((buckets) => buckets.fold(0, (acc, b) => acc + b.assetCount));
}, dependencies: [timelineServiceProvider]);

class _ScopedMapTimeline extends StatelessWidget {
  const _ScopedMapTimeline();

  @override
  Widget build(BuildContext context) {
    // TODO: this causes the timeline to switch to flicker to "loading" state and back. This is both janky and inefficient.
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access archive');
          }

          final users = ref.watch(mapStateProvider).withPartners
              ? ref.watch(timelineUsersProvider).valueOrNull ?? [user.id]
              : [user.id];

          final timelineService = ref
              .watch(timelineFactoryProvider)
              .map(users, ref.watch(mapStateProvider).toOptions());
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: const _MapTimelineContent(),
    );
  }
}

class _MapTimelineContent extends ConsumerWidget {
  const _MapTimelineContent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(_mapAssetCountProvider).valueOrNull ?? 0;
    return Column(
      children: [
        Text(context.t.map_assets_in_bounds(count: count), style: context.themeData.textTheme.headlineSmall),
        const Expanded(
          child: Timeline(appBar: null, bottomSheet: GeneralBottomSheet(minChildSize: 0.23), withScrubber: false),
        ),
      ],
    );
  }
}

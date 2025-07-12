import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class MapBottomSheet extends ConsumerWidget {
  const MapBottomSheet({super.key, required this.assetIds});

  final List<String> assetIds;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService =
                ref.watch(timelineFactoryProvider).map(assetIds);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          }
        ),
      ],
      child: const BaseBottomSheet(
        initialChildSize: 0.25,
        shouldCloseOnMinExtent: false,
        actions: [],
        slivers: [
          SliverToBoxAdapter(
            // TODO: Need refactor timeline and bottom sheet first
            child: SizedBox(
              height: 600,
              width: 800,
              child: Timeline(),
            ),
          ),
        ],
      ),
    );
  }
}

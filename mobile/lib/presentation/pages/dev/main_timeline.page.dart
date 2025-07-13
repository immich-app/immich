import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneProvider = ref.watch(driftMemoryFutureProvider);

    return memoryLaneProvider.when(
      data: (memories) {
        return memories.isEmpty
            ? const Timeline(showStorageIndicator: true)
            : Timeline(
                topSliverWidget: SliverToBoxAdapter(
                  key: Key('memory-lane-${memories.first.assets.first.id}'),
                  child: DriftMemoryLane(memories: memories),
                ),
                topSliverWidgetHeight: 200,
                showStorageIndicator: true,
              );
      },
      loading: () => const Timeline(showStorageIndicator: true),
      error: (error, stackTrace) => const Timeline(showStorageIndicator: true),
    );
  }
}

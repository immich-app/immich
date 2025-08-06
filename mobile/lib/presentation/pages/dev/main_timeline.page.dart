import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneProvider = ref.watch(driftMemoryFutureProvider);
    final memoriesEnabled = ref.watch(currentUserProvider.select((user) => user?.memoryEnabled ?? true));

    // TODO: the user preferences need to be updated
    // from the server to get live hiding/showing of memory lane

    return memoryLaneProvider.maybeWhen(
      data: (memories) {
        return memories.isEmpty || !memoriesEnabled
            ? const Timeline()
            : Timeline(
                topSliverWidget: SliverToBoxAdapter(
                  key: Key('memory-lane-${memories.first.assets.first.id}'),
                  child: DriftMemoryLane(memories: memories),
                ),
                topSliverWidgetHeight: 200,
              );
      },
      orElse: () => const Timeline(),
    );
  }
}

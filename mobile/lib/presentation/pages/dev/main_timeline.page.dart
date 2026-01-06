import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasMemories = ref.watch(driftMemoryFutureProvider.select((state) => state.value?.isNotEmpty ?? false));
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final timelineUsers = ref.watch(timelineUsersProvider).valueOrNull ?? [];
          final timelineService = ref.watch(timelineFactoryProvider).unorganized(timelineUsers);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        topSliverWidget: const SliverToBoxAdapter(child: DriftMemoryLane()),
        topSliverWidgetHeight: hasMemories ? 200 : 0,
        showStorageIndicator: true,
      ),
    );
  }
}

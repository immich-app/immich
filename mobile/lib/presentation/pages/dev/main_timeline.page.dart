import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneProvider = ref.watch(driftMemoryFutureProvider);

    return memoryLaneProvider.maybeWhen(
      data: (memories) {
        return memories.isEmpty
            ? Timeline(showStorageIndicator: Store.tryGet(StoreKey.storageIndicator) ?? true)
            : Timeline(
                topSliverWidget: SliverToBoxAdapter(
                  key: Key('memory-lane-${memories.first.assets.first.id}'),
                  child: DriftMemoryLane(memories: memories),
                ),
                topSliverWidgetHeight: 200,
                showStorageIndicator: true,
              );
      },
      orElse: () => Timeline(showStorageIndicator: Store.tryGet(StoreKey.storageIndicator) ?? true),
    );
  }
}

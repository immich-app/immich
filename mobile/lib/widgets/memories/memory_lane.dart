import 'package:auto_route/auto_route.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/memories/memory.model.dart';
import 'package:immich_mobile/widgets/asset_grid/thumbnail_placeholder.dart';
import 'package:immich_mobile/providers/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/widgets/common/immich_image.dart';

class MemoryLane extends HookConsumerWidget {
  const MemoryLane({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneFutureProvider = ref.watch(memoryFutureProvider);

    final memoryLane = memoryLaneFutureProvider
        .whenData(
          (memories) => memories != null
              ? ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxHeight: 200,
                  ),
                  child: CarouselView(
                    itemExtent: 145.0,
                    shrinkExtent: 1.0,
                    elevation: 2,
                    backgroundColor: Colors.black,
                    overlayColor: WidgetStateProperty.all(
                      Colors.white.withValues(alpha: 0.1),
                    ),
                    onTap: (memoryIndex) {
                      ref.read(hapticFeedbackProvider.notifier).heavyImpact();
                      if (memories[memoryIndex].assets.isNotEmpty) {
                        final asset = memories[memoryIndex].assets[0];
                        ref.read(currentAssetProvider.notifier).set(asset);
                        if (asset.isVideo || asset.isMotionPhoto) {
                          ref.read(videoPlaybackValueProvider.notifier).reset();
                        }
                      }
                      context.pushRoute(
                        MemoryRoute(
                          memories: memories,
                          memoryIndex: memoryIndex,
                        ),
                      );
                    },
                    children: memories
                        .mapIndexed<Widget>(
                          (index, memory) => MemoryCard(
                            index: index,
                            memory: memory,
                          ),
                        )
                        .toList(),
                  ),
                )
              : const SizedBox(),
        )
        .value;

    return memoryLane ?? const SizedBox();
  }
}

class MemoryCard extends ConsumerWidget {
  const MemoryCard({
    super.key,
    required this.index,
    required this.memory,
  });

  final int index;
  final Memory memory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Stack(
        children: [
          ColorFiltered(
            colorFilter: ColorFilter.mode(
              Colors.black.withValues(alpha: 0.2),
              BlendMode.darken,
            ),
            child: Hero(
              tag: 'memory-${memory.assets[0].id}',
              child: ImmichImage(
                memory.assets[0],
                fit: BoxFit.cover,
                width: 205,
                height: 200,
                placeholder: const ThumbnailPlaceholder(
                  width: 105,
                  height: 200,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 16,
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 114,
              ),
              child: Text(
                memory.title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

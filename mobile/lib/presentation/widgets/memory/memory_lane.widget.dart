import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/current_asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class DriftMemoryLane extends ConsumerWidget {
  final List<DriftMemory> memories;

  const DriftMemoryLane({super.key, required this.memories});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ConstrainedBox(
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
        onTap: (index) {
          ref.read(hapticFeedbackProvider.notifier).heavyImpact();

          if (memories[index].assets.isNotEmpty) {
            final asset = memories[index].assets[0];
            ref.read(currentAssetNotifier.notifier).setAsset(asset);

            if (asset.isVideo) {
              ref.read(videoPlaybackValueProvider.notifier).reset();
            }
          }

          context.pushRoute(
            DriftMemoryRoute(
              memories: memories,
              memoryIndex: index,
            ),
          );
        },
        children:
            memories.map((memory) => DriftMemoryCard(memory: memory)).toList(),
      ),
    );
  }
}

class DriftMemoryCard extends ConsumerWidget {
  const DriftMemoryCard({
    super.key,
    required this.memory,
  });

  final DriftMemory memory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final yearsAgo = DateTime.now().year - memory.data.year;
    final title = 'years_ago'.t(
      context: context,
      args: {
        'years': yearsAgo.toString(),
      },
    );
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
              child: SizedBox(
                width: 205,
                height: 200,
                child: Thumbnail(
                  remoteId: memory.assets[0].id,
                  fit: BoxFit.cover,
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
                title,
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

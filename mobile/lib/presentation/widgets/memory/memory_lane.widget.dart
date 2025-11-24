import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class DriftMemoryLane extends ConsumerWidget {
  const DriftMemoryLane({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneProvider = ref.watch(driftMemoryFutureProvider);
    final memories = memoryLaneProvider.value ?? const [];
    if (memories.isEmpty) {
      return const SizedBox.shrink();
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(maxHeight: 200),
      child: CarouselView(
        itemExtent: 145.0,
        shrinkExtent: 1.0,
        elevation: 2,
        backgroundColor: Colors.black,
        overlayColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.1)),
        onTap: (index) {
          ref.read(hapticFeedbackProvider.notifier).heavyImpact();
          if (memories[index].assets.isNotEmpty) {
            DriftMemoryPage.setMemory(ref, memories[index]);
          }
          context.pushRoute(DriftMemoryRoute(memories: memories, memoryIndex: index));
        },
        children: memories
            .map((memory) => DriftMemoryCard(key: Key(memory.id), memory: memory))
            .toList(growable: false),
      ),
    );
  }
}

class DriftMemoryCard extends ConsumerWidget {
  const DriftMemoryCard({super.key, required this.memory});

  final DriftMemory memory;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final yearsAgo = DateTime.now().year - memory.data.year;
    final title = 'years_ago'.t(context: context, args: {'years': yearsAgo.toString()});
    return Center(
      child: Stack(
        children: [
          ColorFiltered(
            colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.2), BlendMode.darken),
            child: SizedBox(
              width: 205,
              height: 200,
              child: Thumbnail.remote(remoteId: memory.assets[0].id, fit: BoxFit.cover),
            ),
          ),
          Positioned(
            bottom: 16,
            left: 16,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 114),
              child: Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

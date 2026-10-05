import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/pages/memory.page.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/presentation/widgets/memory/memory_title.widget.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class MemoryLane extends ConsumerWidget {
  const MemoryLane({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLane = ref.watch(memoryLaneProvider);
    final memories = memoryLane.value ?? const [];
    if (memories.isEmpty) {
      return const SizedBox.shrink();
    }

    void handleTap(int index) {
      ref.read(hapticFeedbackProvider.notifier).heavyImpact();
      if (memories[index].assets.isNotEmpty) {
        MemoryPage.setMemory(ref, memories[index]);
      }
      unawaited(context.pushRoute(MemoryRoute(memories: memories, memoryIndex: index)));
    }

    return SizedBox(
      height: 200,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemExtent: 170.0,
        itemCount: memories.length,
        itemBuilder: (context, index) => Padding(
          key: Key(memories[index].id),
          padding: const EdgeInsets.all(4),
          child: Material(
            color: Colors.black,
            elevation: 2,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(24))),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                MemoryCard(memory: memories[index]),
                Material(
                  type: MaterialType.transparency,
                  child: InkWell(
                    overlayColor: WidgetStateProperty.all(Colors.white.withValues(alpha: 0.1)),
                    onTap: () => handleTap(index),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class MemoryCard extends StatelessWidget {
  const MemoryCard({super.key, required this.memory});

  final Memory memory;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        ColorFiltered(
          colorFilter: ColorFilter.mode(Colors.black.withValues(alpha: 0.2), BlendMode.darken),
          child: Thumbnail.remote(
            remoteId: memory.assets[0].id,
            thumbhash: memory.assets[0].thumbHash ?? "",
            fit: BoxFit.cover,
          ),
        ),
        Positioned(
          left: 16,
          right: 16,
          bottom: 16,
          child: MemoryTitle(
            type: memory.type,
            title: getMemoryTitle(context.t, memory),
            style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 15),
          ),
        ),
      ],
    );
  }
}

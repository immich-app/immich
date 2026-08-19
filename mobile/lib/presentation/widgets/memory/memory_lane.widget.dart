import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/routing/router.dart';

const double _kCardExtent = 184.0;

class MemoryLane extends ConsumerWidget {
  const MemoryLane({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memoryLaneProvider = ref.watch(driftMemoryFutureProvider);

    final memories =
        memoryLaneProvider.value?.where((memory) => memory.assets.isNotEmpty).toList(growable: false) ??
        const <DriftMemory>[];

    if (memories.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: kMemoryLaneHeight,
      child: CarouselView(
        itemExtent: _kCardExtent,
        shrinkExtent: _kCardExtent,
        padding: const EdgeInsets.symmetric(horizontal: 4.0),
        itemSnapping: false,
        elevation: 0,
        backgroundColor: context.colorScheme.surfaceContainerHigh,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(20.0))),
        overlayColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.pressed)) {
            return Colors.white.withValues(alpha: 0.15);
          }
          if (states.contains(WidgetState.hovered) || states.contains(WidgetState.focused)) {
            return Colors.white.withValues(alpha: 0.08);
          }
          return null;
        }),
        onTap: (index) {
          ref.read(hapticFeedbackProvider.notifier).heavyImpact();
          DriftMemoryPage.setMemory(ref, memories[index]);
          unawaited(context.pushRoute(DriftMemoryRoute(memories: memories, memoryIndex: index)));
        },
        children: memories.map((memory) => MemoryCard(key: Key(memory.id), memory: memory)).toList(growable: false),
      ),
    );
  }
}

class MemoryCard extends StatelessWidget {
  const MemoryCard({super.key, required this.memory});

  final DriftMemory memory;

  @override
  Widget build(BuildContext context) {
    final yearsAgo = DateTime.now().year - memory.data.year;
    final title = context.t.years_ago(years: yearsAgo);

    return Stack(
      fit: StackFit.expand,
      children: [
        Thumbnail.remote(remoteId: memory.assets[0].id, thumbhash: memory.assets[0].thumbHash ?? "", fit: BoxFit.cover),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Colors.transparent, Colors.black54],
              stops: [0.4, 1.0],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
          child: Align(
            alignment: AlignmentDirectional.bottomStart,
            child: Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                color: Colors.white,
                fontSize: 17,
                height: 1.15,
                letterSpacing: -0.2,
                shadows: [Shadow(color: Colors.black38, blurRadius: 8, offset: Offset(0, 1))],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

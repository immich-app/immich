import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

@RoutePage()
class MainTimelinePage extends ConsumerWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ProviderScope(
      key: ref.watch(timelineUsersProvider).value != null
          ? ValueKey(ref.watch(timelineUsersProvider).value)
          : const ValueKey("main-timeline"),
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineUsers =
                ref.watch(timelineUsersProvider).valueOrNull ?? [];
            final timelineService =
                ref.watch(timelineFactoryProvider).main(timelineUsers);
            ref.onDispose(() => unawaited(timelineService.dispose()));
            return timelineService;
          },
        ),
      ],
      child: const Timeline(),
    );
  }
}

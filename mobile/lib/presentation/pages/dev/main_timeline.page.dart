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
    final timelineUsersAsync = ref.watch(timelineUsersProvider);

    return timelineUsersAsync.when(
      data: (timelineUsers) {
        if (timelineUsers.isEmpty) {
          return const Center(child: Text('No timeline users available'));
        }

        return ProviderScope(
          overrides: [
            timelineServiceProvider.overrideWith(
              (ref) {
                final timelineService =
                    ref.watch(timelineFactoryProvider).main(timelineUsers);
                ref.onDispose(() => unawaited(timelineService.dispose()));
                return timelineService;
              },
            ),
          ],
          child: const Timeline(),
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => Center(child: Text('Error: $error')),
    );
  }
}

import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class MainTimelinePage extends StatelessWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineService = ref
                .watch(timelineFactoryProvider)
                .main(ref.watch(timelineUsersIdsProvider));
            ref.onDispose(() => unawaited(timelineService.dispose()));
            return timelineService;
          },
        ),
      ],
      child: const Timeline(),
    );
  }
}

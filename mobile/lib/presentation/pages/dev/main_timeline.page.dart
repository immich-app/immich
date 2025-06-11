import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

@RoutePage()
class MainTimelinePage extends StatelessWidget {
  const MainTimelinePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) => TimelineService.main(
            repository: ref.watch(timelineRepositoryProvider),
          ),
        ),
      ],
      child: const Timeline(),
    );
  }
}

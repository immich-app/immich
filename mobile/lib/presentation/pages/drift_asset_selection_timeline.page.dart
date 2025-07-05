import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

@RoutePage()
class DriftAssetSelectionTimelinePage extends StatelessWidget {
  final List<String> lockSelectionIds;

  const DriftAssetSelectionTimelinePage({
    super.key,
    this.lockSelectionIds = const [],
  });

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith(
          (ref) {
            final timelineUsers =
                ref.watch(timelineUsersProvider).valueOrNull ?? [];
            final timelineService =
                ref.watch(timelineFactoryProvider).remoteAssets(timelineUsers);
            ref.onDispose(timelineService.dispose);
            return timelineService;
          },
        ),
      ],
      child: Timeline(
        lockSelectionIds: lockSelectionIds,
        selectionMode: true,
      ),
    );
  }
}

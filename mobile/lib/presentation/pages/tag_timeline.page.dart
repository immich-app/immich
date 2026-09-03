import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/tags/tag_options.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';

@RoutePage()
class TagTimelinePage extends StatelessWidget {
  final String tagId;
  final String tagName;
  final String? tagColor;

  const TagTimelinePage({super.key, required this.tagId, required this.tagName, this.tagColor});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to view tag timeline');
          }

          final timelineService = ref.watch(timelineFactoryProvider).tag(user.id, tagId);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: MesmerizingSliverAppBar(
          title: tagName,
          icon: Icons.sell_rounded,
          actions: [TagOptionsMenu(id: tagId, leafName: tagName.split('/').last, path: tagName, color: tagColor)],
        ),
      ),
    );
  }
}

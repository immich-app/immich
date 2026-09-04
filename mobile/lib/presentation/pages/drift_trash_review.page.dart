import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/trash_review.action.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class DriftTrashReviewPage extends StatelessWidget {
  const DriftTrashReviewPage({super.key});

  @override
  Widget build(BuildContext context) => ProviderScope(
    overrides: [
      timelineServiceProvider.overrideWith((ref) {
        final user = ref.watch(currentUserProvider);
        if (user == null) {
          throw Exception('User must be logged in to access trash');
        }
        final timelineService = ref.watch(timelineFactoryProvider).syncTrash();
        ref.onDispose(timelineService.dispose);
        return timelineService;
      }),
    ],
    child: Timeline(
      appBar: SliverAppBar(
        title: Text(context.t.trash_review_title),
        floating: true,
        snap: true,
        pinned: true,
        centerTitle: true,
        elevation: 0,
        actions: const [_TrashReviewKebabMenu()],
      ),
      topSliverWidgetHeight: 24,
      topSliverWidget: SliverPadding(
        padding: const EdgeInsets.all(16.0),
        sliver: SliverToBoxAdapter(
          child: Consumer(
            builder: (context, ref, _) {
              final outOfSyncCount = ref.watch(pendingTrashReviewCountProvider).value ?? 0;
              return outOfSyncCount > 0
                  ? Text(context.t.trash_review_subtitle)
                  : Center(child: Text(context.t.trash_review_empty_subtitle, style: context.textTheme.bodyLarge));
            },
          ),
        ),
      ),
      bottomSheet: const TrashSyncBottomBar(),
    ),
  );
}

class _TrashReviewKebabMenu extends StatelessWidget {
  const _TrashReviewKebabMenu();

  @override
  Widget build(BuildContext context) {
    return MenuAnchor(
      consumeOutsideTap: true,
      style: MenuStyle(
        backgroundColor: WidgetStatePropertyAll(context.themeData.scaffoldBackgroundColor),
        surfaceTintColor: const WidgetStatePropertyAll(Colors.grey),
        elevation: const WidgetStatePropertyAll(4),
        shape: const WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
        ),
        padding: const WidgetStatePropertyAll(EdgeInsets.symmetric(vertical: 6)),
      ),
      menuChildren: const [
        ActionMenuItem(action: KeepOnDeviceAction.all()),
        ActionMenuItem(action: MoveToTrashAction.all()),
      ],
      builder: (context, controller, child) {
        return IconButton(
          icon: const Icon(Icons.more_vert_rounded),
          onPressed: () => controller.isOpen ? controller.close() : controller.open(),
        );
      },
    );
  }
}

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class DriftTrashSyncReviewPage extends ConsumerWidget {
  const DriftTrashSyncReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => ProviderScope(
    overrides: [
      timelineServiceProvider.overrideWith((ref) {
        final user = ref.watch(currentUserProvider);
        if (user == null) {
          throw Exception('User must be logged in to access trash');
        }
        final timelineService = ref.watch(timelineFactoryProvider).toTrashSyncReview();
        ref.onDispose(timelineService.dispose);
        return timelineService;
      }),
    ],
    child: Timeline(
      appBar: SliverAppBar(
        title: Text('asset_out_of_sync_title'.tr()),
        floating: true,
        snap: true,
        pinned: true,
        centerTitle: true,
        elevation: 0,
      ),
      topSliverWidgetHeight: 24,
      topSliverWidget: SliverPadding(
        padding: const EdgeInsets.all(16.0),
        sliver: SliverToBoxAdapter(
          child: SizedBox(
            height: 72.0,
            child: Consumer(
              builder: (context, ref, _) {
                final outOfSyncCount = ref.watch(outOfSyncCountProvider).maybeWhen(data: (v) => v, orElse: () => 0);
                return outOfSyncCount > 0
                    ? const Text('asset_out_of_sync_trash_subtitle').tr()
                    : Center(
                        child: Text('asset_out_of_sync_trash_subtitle_result', style: context.textTheme.bodyLarge).tr(),
                      );
              },
            ),
          ),
        ),
      ),
      bottomSheet: const TrashSyncBottomBar(),
    ),
  );
}

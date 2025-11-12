import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/routing/router.dart';

@RoutePage()
class DriftTrashSyncReviewPage extends ConsumerWidget {
  const DriftTrashSyncReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = context.router;

    final assets = ref.read(pendingApprovalChecksumsProvider).value;
    debugPrint('DriftTrashSyncReviewPage, assets: $assets');
    ref.listen(outOfSyncCountProvider, (previous, next) {
      final prevCount = previous?.asData?.value ?? 0;
      final nextCount = next.asData?.value;
      //todo PeterO
      debugPrint('DriftTrashSyncReviewPage, $prevCount -> $nextCount, previous?.asData?.value: ${previous?.asData?.value}, next.asData?.value: ${next.asData?.value}');
      if (prevCount > 0 && nextCount == 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) async {
          await Future.delayed(const Duration(milliseconds: 1600));
          if (router.current.name == DriftTrashSyncReviewRoute.name) {
            await router.maybePop();
          }
        });
      }
    });
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access trash');
          }
          final timelineService = ref.watch(timelineFactoryProvider).toTrashSyncReview(user.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        showStorageIndicator: true,
        appBar: SliverAppBar(
          title: Text('asset_out_of_sync_title'.tr()),
          floating: true,
          snap: true,
          pinned: true,
          centerTitle: true,
          elevation: 0,
        ),
        topSliverWidgetHeight: 24,
        topSliverWidget: Consumer(
          builder: (context, ref, child) {
            return SliverPadding(
              padding: const EdgeInsets.all(16.0),
              sliver: SliverToBoxAdapter(
                child: SizedBox(height: 72.0, child: const Text("asset_out_of_sync_trash_subtitle").tr()),
              ),
            );
          },
        ),
        bottomSheet: const TrashSyncBottomBar(),
      ),
    );
  }
}

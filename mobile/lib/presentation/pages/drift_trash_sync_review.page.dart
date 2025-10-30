import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/cupertino.dart' show CupertinoSegmentedControl;
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
    ref.listen(outOfSyncCountProvider, (previous, next) {
      final prevCount = previous?.asData?.value ?? 0;
      final nextCount = next.asData?.value ?? 0;
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
          final timelineService = ref.watch(timelineFactoryProvider).trashSyncReview(user.id);
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
                child: Column(
                  children: [
                    // Container(
                    //   width: 500,
                    //   child: CupertinoSegmentedControl<int>(
                    //     selectedColor: Colors.grey,
                    //     unselectedColor: Colors.transparent,
                    //     borderColor: Colors.white,
                    //     children: {
                    //       0: Text('Deleted'),
                    //       1: Text('Restored'),
                    //     },
                    //     onValueChanged: (int val) {
                    //
                    //     },
                    //     groupValue: 0,
                    //   ),
                    // ),
                  const SizedBox(height: 8,),
                    ListTile(
                        title: SizedBox(height: 72.0, child: const Text("asset_out_of_sync_subtitle").tr()),
                      onTap: () async {
                        final res = await ref.read(trashSyncServiceProvider).watchPendingApprovalChecksums().first;
                        debugPrint('watchPendingApprovalChecksums: $res');
                      },

                    ),

                  ],
                ),
              ),
            );
          },
        ),
        bottomSheet: const TrashSyncBottomBar(),
      ),
    );
  }
}

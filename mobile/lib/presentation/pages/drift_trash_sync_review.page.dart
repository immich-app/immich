import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

@RoutePage()
class DriftTrashSyncReviewPage extends HookConsumerWidget {
  const DriftTrashSyncReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = useTabController(initialLength: 2);
    useListenable(controller);
    final router = context.router;
    ref.listen(outOfSyncCountProvider, (previous, next) {
      final prevCount = previous?.asData?.value ?? 0;
      final nextCount = next.asData?.value ?? 0;
      // if (prevCount > 0 && nextCount == 0) {
      //   WidgetsBinding.instance.addPostFrameCallback((_) async {
      //     await Future.delayed(const Duration(milliseconds: 1600));
      //     if (router.current.name == DriftTrashSyncReviewRoute.name) {
      //       await router.maybePop();
      //     }
      //   });
      // }
    });

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, inner) => [
          SliverOverlapAbsorber(
            handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
            sliver: SliverAppBar(
              title: Text('asset_out_of_sync_title'.tr()),
              pinned: true,
              forceElevated: inner,
              bottom: TabBar(
                controller: controller,
                tabs: [
                  Consumer(
                    builder: (context, ref, _) {
                      final count = ref.watch(trashedCountProvider).maybeWhen(data: (v) => v, orElse: () => 0);
                      return Tab(text: count > 0 ? 'Trashed ($count)' : 'Trashed');
                    },
                  ),
                  Consumer(
                    builder: (context, ref, _) {
                      final count = ref.watch(restoredCountProvider).maybeWhen(data: (v) => v, orElse: () => 0);
                      return Tab(text: count > 0 ? 'Restored ($count)' : 'Restored');
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
        body: TabBarView(controller: controller, children: const [_ToTrash(), _ToRestore()]),
      ),
    );
  }
}

class _ToTrash extends StatelessWidget {
  const _ToTrash();

  @override
  Widget build(BuildContext context) {
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
        appBar: const SliverToBoxAdapter(child: SizedBox.shrink()),
        topSliverWidgetHeight: 24,
        topSliverWidget: SliverPadding(
          padding: const EdgeInsets.all(16.0),
          sliver: SliverToBoxAdapter(
            child: SizedBox(height: 72.0, child: const Text("asset_out_of_sync_trash_subtitle").tr()),
          ),
        ),
        bottomSheet: const TrashSyncBottomBar(),
        nested: true,
        withScrubber: false,
      ),
    );
  }
}

class _ToRestore extends StatelessWidget {
  const _ToRestore();

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access trash');
          }
          final timelineService = ref.watch(timelineFactoryProvider).toRestoreSyncReview(user.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: null,
        topSliverWidgetHeight: 24,
        topSliverWidget: SliverPadding(
          padding: const EdgeInsets.all(16.0),
          sliver: SliverToBoxAdapter(
            child: SizedBox(height: 72.0, child: const Text("asset_out_of_sync_restore_subtitle").tr()),
          ),
        ),
        bottomSheet: const TrashSyncBottomBar(),
        nested: true,
        withScrubber: false,
      ),
    );
  }
}

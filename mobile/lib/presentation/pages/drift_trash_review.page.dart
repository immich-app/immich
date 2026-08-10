import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/keep_on_device_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';

@RoutePage()
class DriftTrashReviewPage extends ConsumerWidget {
  const DriftTrashReviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => ProviderScope(
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
        title: Text('asset_out_of_sync_title'.tr()),
        floating: true,
        snap: true,
        pinned: true,
        centerTitle: true,
        elevation: 0,
        actions: [const _TrashReviewKebabMenu()],
      ),
      topSliverWidgetHeight: 24,
      topSliverWidget: SliverPadding(
        padding: const EdgeInsets.all(16.0),
        sliver: SliverToBoxAdapter(
          child: SizedBox(
            height: 72.0,
            child: Consumer(
              builder: (context, ref, _) {
                final outOfSyncCount = ref.watch(pendingTrashReviewCountProvider).value ?? 0;
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

class _TrashReviewKebabMenu extends ConsumerWidget {
  const _TrashReviewKebabMenu();

  Future<void> _keepAllOnDevice(BuildContext context, WidgetRef ref) async {
    final result = await ref.read(actionProvider.notifier).resolveAllRemoteTrash(keep: true);
    if (!context.mounted) {
      return;
    }
    showKeepResultToast(context, result);
  }

  Future<void> _moveAllToTrash(BuildContext context, WidgetRef ref) async {
    final count = ref.read(pendingTrashReviewCountProvider).value ?? 0;
    await showDialog<bool>(
      context: context,
      builder: (_) => ConfirmDialog(
        title: context.t.asset_out_of_sync_trash_confirmation_title,
        content: context.t.asset_out_of_sync_trash_confirmation_text(count: count),
        onOk: () async {
          final result = await ref.read(actionProvider.notifier).resolveAllRemoteTrash(keep: false);
          if (!context.mounted) {
            return;
          }
          showTrashResultToast(context, result);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
      menuChildren: [
        BaseActionButton(
          label: context.t.keep_all,
          iconData: Icons.cloud_off_outlined,
          onPressed: () => _keepAllOnDevice(context, ref),
          menuItem: true,
        ),
        BaseActionButton(
          label: context.t.trash_all,
          iconData: Icons.delete_outline_rounded,
          onPressed: () => _moveAllToTrash(context, ref),
          menuItem: true,
        ),
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

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

@RoutePage()
class DriftTrashPage extends StatelessWidget {
  const DriftTrashPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        timelineServiceProvider.overrideWith((ref) {
          final user = ref.watch(currentUserProvider);
          if (user == null) {
            throw Exception('User must be logged in to access trash');
          }

          final timelineService = ref.watch(timelineFactoryProvider).trash(user.id);
          ref.onDispose(timelineService.dispose);
          return timelineService;
        }),
      ],
      child: Timeline(
        appBar: SliverAppBar(
          title: Text('trash'.t(context: context)),
          floating: true,
          snap: true,
          pinned: true,
          centerTitle: true,
          elevation: 0,
          actions: [const _TrashKebabMenu()],
        ),
        topSliverWidgetHeight: 24,
        topSliverWidget: Consumer(
          builder: (context, ref, child) {
            final trashDays = ref.watch(serverInfoProvider.select((v) => v.serverConfig.trashDays));

            return SliverPadding(
              padding: const EdgeInsets.all(16.0),
              sliver: SliverToBoxAdapter(child: Text(context.t.trash_page_info(days: trashDays))),
            );
          },
        ),
        bottomSheet: const TrashBottomBar(),
      ),
    );
  }
}

class _TrashKebabMenu extends ConsumerWidget {
  const _TrashKebabMenu();

  Future<void> _onEmptyTrash(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) =>
          ConfirmDialog(title: context.t.empty_trash, content: context.t.empty_trash_confirmation, onOk: () {}),
    );
    if (confirmed == true && context.mounted) {
      final result = await ref.read(actionProvider.notifier).emptyTrash();
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: result.success
              ? context.t.assets_permanently_deleted_count(count: result.count)
              : context.t.scaffold_body_error_occurred,
          toastType: result.success ? ToastType.success : ToastType.error,
        );
      }
    }
  }

  Future<void> _onRestoreAll(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) =>
          ConfirmDialog(title: context.t.restore_all, content: context.t.assets_restore_confirmation, onOk: () {}),
    );
    if (confirmed == true && context.mounted) {
      final result = await ref.read(actionProvider.notifier).restoreAllTrash();
      if (context.mounted) {
        ImmichToast.show(
          context: context,
          msg: result.success
              ? context.t.assets_restored_count(count: result.count)
              : context.t.scaffold_body_error_occurred,
          toastType: result.success ? ToastType.success : ToastType.error,
        );
      }
    }
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
          label: context.t.empty_trash,
          iconData: Icons.delete_forever_outlined,
          onPressed: () => _onEmptyTrash(context, ref),
          menuItem: true,
        ),
        BaseActionButton(
          label: context.t.restore_all,
          iconData: Icons.restore_outlined,
          onPressed: () => _onRestoreAll(context, ref),
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

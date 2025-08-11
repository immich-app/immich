import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/allow_move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/deny_move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class TrashSyncBottomBar extends ConsumerWidget {
  const TrashSyncBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appRouter = ref.read(appRouterProvider);
    callback() async {
      final outOfSyncCount = ref.read(outOfSyncCountProvider).maybeWhen(data: (count) => count, orElse: () => 0);
      if (outOfSyncCount == 0) {
          await Future.delayed(const Duration(milliseconds: 200));
          var popped = await appRouter.maybePop();
          if (!popped) {
            await appRouter.root.maybePop();
          }
      }
    }

    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: SizedBox(
          height: 64,
          child: Container(
            color: context.themeData.canvasColor,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                DenyMoveToTrashActionButton(source: ActionSource.timeline, onSuccess: callback),
                AllowMoveToTrashActionButton(source: ActionSource.timeline, onSuccess: callback),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

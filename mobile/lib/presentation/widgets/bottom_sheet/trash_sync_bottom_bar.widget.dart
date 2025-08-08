import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/allow_move_to_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/deny_move_to_trash_action_button.widget.dart';

class TrashSyncBottomBar extends ConsumerWidget {
  const TrashSyncBottomBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: SizedBox(
          height: 64,
          child: Container(
            color: context.themeData.canvasColor,
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                DenyMoveToTrashActionButton(source: ActionSource.timeline),
                AllowMoveToTrashActionButton(source: ActionSource.timeline),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

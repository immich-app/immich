import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/restore_trash_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';

class TrashBottomBar extends ConsumerWidget implements TimelineBottomSheet {
  const TrashBottomBar({super.key});

  @override
  double get minChildSize => 0.1;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        color: context.themeData.canvasColor,
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: const SafeArea(
          top: false,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              DeleteTrashActionButton(source: ActionSource.timeline),
              RestoreTrashActionButton(source: ActionSource.timeline),
            ],
          ),
        ),
      ),
    );
  }
}

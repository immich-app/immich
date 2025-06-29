import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class MoveToLockFolderActionButton extends ConsumerWidget {
  const MoveToLockFolderActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 100.0,
      iconData: Icons.lock_outline_rounded,
      label: "move_to_locked_folder".t(context: context),
    );
  }
}

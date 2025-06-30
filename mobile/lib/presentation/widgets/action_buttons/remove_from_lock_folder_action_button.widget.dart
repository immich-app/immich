import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class RemoveFromLockFolderActionButton extends ConsumerWidget {
  const RemoveFromLockFolderActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 100.0,
      iconData: Icons.lock_open_rounded,
      label: "remove_from_locked_folder".t(context: context),
    );
  }
}

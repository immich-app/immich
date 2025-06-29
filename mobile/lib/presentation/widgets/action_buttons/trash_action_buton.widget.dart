import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class TrashActionButton extends ConsumerWidget {
  const TrashActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 85.0,
      iconData: Icons.delete_outline_rounded,
      label: "control_bottom_app_bar_trash_from_immich".t(context: context),
    );
  }
}

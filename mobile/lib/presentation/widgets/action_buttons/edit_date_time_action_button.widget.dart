import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class EditDateTimeActionButton extends ConsumerWidget {
  const EditDateTimeActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 95.0,
      iconData: Icons.edit_calendar_outlined,
      label: "control_bottom_app_bar_edit_time".t(context: context),
    );
  }
}

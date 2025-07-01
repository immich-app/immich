import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class EditLocationActionButton extends ConsumerWidget {
  const EditLocationActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.edit_location_alt_outlined,
      label: "control_bottom_app_bar_edit_location".t(context: context),
    );
  }
}

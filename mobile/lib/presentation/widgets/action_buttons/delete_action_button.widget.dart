import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class DeletePermanentActionButton extends ConsumerWidget {
  const DeletePermanentActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 110.0,
      iconData: Icons.delete_forever,
      label: "delete_dialog_title".t(context: context),
    );
  }
}

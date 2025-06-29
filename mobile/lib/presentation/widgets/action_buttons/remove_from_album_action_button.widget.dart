import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class RemoveFromAlbumActionButton extends ConsumerWidget {
  const RemoveFromAlbumActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.remove_circle_outline,
      label: "remove_from_album".t(context: context),
    );
  }
}

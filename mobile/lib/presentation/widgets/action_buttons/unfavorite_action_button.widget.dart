import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';

class UnFavoriteActionButton extends ConsumerWidget {
  const UnFavoriteActionButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.favorite_rounded,
      label: "unfavorite".t(context: context),
    );
  }
}

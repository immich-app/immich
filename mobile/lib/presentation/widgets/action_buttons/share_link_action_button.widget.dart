import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';

class ShareLinkActionButton extends ConsumerWidget {
  final ActionSource source;

  const ShareLinkActionButton({super.key, required this.source});

  _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    await ref.read(actionProvider.notifier).shareLink(source, context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.link_rounded,
      label: "share_link".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}

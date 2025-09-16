import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';

class AdvancedInfoActionButton extends ConsumerWidget {
  final ActionSource source;

  const AdvancedInfoActionButton({super.key, required this.source});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    ref.read(actionProvider.notifier).troubleshoot(source, context);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 115.0,
      iconData: Icons.help_outline_rounded,
      label: "troubleshoot".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}

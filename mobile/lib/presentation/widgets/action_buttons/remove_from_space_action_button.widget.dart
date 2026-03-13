import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class RemoveFromSpaceActionButton extends ConsumerWidget {
  final String spaceId;
  final ActionSource source;
  final VoidCallback? onComplete;

  const RemoveFromSpaceActionButton({super.key, required this.spaceId, required this.source, this.onComplete});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) return;

    final result = await ref.read(actionProvider.notifier).removeFromSpace(source, spaceId);
    ref.read(multiSelectProvider.notifier).reset();
    onComplete?.call();

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success
            ? '${result.count} photos removed from space'
            : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.remove_circle_outline,
      label: 'Remove from space',
      onPressed: () => _onTap(context, ref),
      maxWidth: 100,
    );
  }
}

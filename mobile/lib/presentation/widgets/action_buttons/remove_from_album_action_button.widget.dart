import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class RemoveFromAlbumActionButton extends ConsumerWidget {
  final String albumId;
  final ActionSource source;

  const RemoveFromAlbumActionButton({
    super.key,
    required this.albumId,
    required this.source,
  });

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final result = await ref
        .read(actionProvider.notifier)
        .removeFromAlbum(source, albumId);
    ref.read(multiSelectProvider.notifier).reset();

    final successMessage = 'remove_from_album_action_prompt'.t(
      context: context,
      args: {'count': result.count.toString()},
    );

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success
            ? successMessage
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
      label: "remove_from_album".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}

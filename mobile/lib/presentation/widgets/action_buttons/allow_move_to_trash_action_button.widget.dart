import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

/// This move to trash action has the following behavior:
/// - Allows moving to the local trash those assets that are in the remote trash.
///
/// This action is used when the asset is selected in multi-selection mode in the review out-of-sync changes
class AllowMoveToTrashActionButton extends ConsumerWidget {
  final ActionSource source;

  const AllowMoveToTrashActionButton({super.key, required this.source});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final result = await ref.read(actionProvider.notifier).setMoveToTrashDecision(source, true);
    ref.read(multiSelectProvider.notifier).reset();

    final successMessage = 'assets_allowed_to_moved_to_trash_count'.t(context: context, args: {'count': result.count.toString()});

    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: result.success ? ToastType.success : ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return TextButton(
      child: Text("Allow", style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
      onPressed: () => _onTap(context, ref),
    );
  }
}

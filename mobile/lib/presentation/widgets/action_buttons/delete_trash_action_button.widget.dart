import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/asset_grid/trash_delete_dialog.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

/// This delete action has the following behavior:
/// - Delete permanently on the server
/// - Prompt to delete the asset locally
///
/// This action is used when the asset is selected in multi-selection mode in the trash page
class DeleteTrashActionButton extends ConsumerWidget {
  final ActionSource source;

  const DeleteTrashActionButton({super.key, required this.source});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final selectCount = ref.watch(multiSelectProvider.select((s) => s.selectedAssets.length));

    final confirmDelete =
        await showDialog<bool>(
          context: context,
          builder: (context) => TrashDeleteDialog(count: selectCount),
        ) ??
        false;
    if (!confirmDelete) {
      return;
    }

    final result = await ref.read(actionProvider.notifier).deleteRemoteAndLocal(source);
    ref.read(multiSelectProvider.notifier).reset();

    final successMessage = 'assets_permanently_deleted_count'.t(
      context: context,
      args: {'count': result.count.toString()},
    );

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
    return TextButton.icon(
      icon: Icon(Icons.delete_forever, color: Colors.red[400]),
      label: Text(
        "delete".t(context: context),
        style: TextStyle(fontSize: 14, color: Colors.red[400], fontWeight: FontWeight.bold),
      ),
      onPressed: () => _onTap(context, ref),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

// Reusable helper: move to locked folder from any source (e.g called from menu)
Future<void> performMoveToLockFolderAction(BuildContext context, WidgetRef ref, {required ActionSource source}) async {
  if (!context.mounted) return;

  final result = await ref.read(actionProvider.notifier).moveToLockFolder(source);
  ref.read(multiSelectProvider.notifier).reset();

  if (source == ActionSource.viewer) {
    EventStream.shared.emit(const ViewerReloadAssetEvent());
  }

  final successMessage = 'move_to_lock_folder_action_prompt'.t(
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

class MoveToLockFolderActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const MoveToLockFolderActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  Future<void> _onTap(BuildContext context, WidgetRef ref) async {
    await performMoveToLockFolderAction(context, ref, source: source);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      maxWidth: 115.0,
      iconData: Icons.lock_outline_rounded,
      label: "move_to_locked_folder".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}

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

/// This delete action has the following behavior:
/// - Set the deletedAt information, put the asset in the trash in the server
/// which will be permanently deleted after the number of days configure by the admin
class TrashActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const TrashActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final result = await ref.read(actionProvider.notifier).trash(source);
    ref.read(multiSelectProvider.notifier).reset();

    if (source == ActionSource.viewer) {
      EventStream.shared.emit(const ViewerReloadAssetEvent());
    }

    final successMessage = 'trash_action_prompt'.t(context: context, args: {'count': result.count.toString()});

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
    return BaseActionButton(
      maxWidth: 85.0,
      iconData: Icons.delete_outline_rounded,
      label: "control_bottom_app_bar_trash_from_immich".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}

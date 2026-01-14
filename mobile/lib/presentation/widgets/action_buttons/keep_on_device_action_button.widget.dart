import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.state.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

void showKeepResultToast(BuildContext context, ActionResult result) {
  if (!context.mounted) return;
  final message = result.success
      ? 'assets_denied_to_moved_to_trash_count'.t(args: {'count': '${result.count}'})
      : 'scaffold_body_error_occurred'.t();
  ImmichToast.show(
    context: context,
    msg: message,
    gravity: ToastGravity.BOTTOM,
    toastType: result.success ? ToastType.success : ToastType.error,
  );
}

/// This deny move to trash action has the following behavior:
/// - Deny moving to the local trash those assets that are in the remote trash.
///
/// This action is used when the asset is selected in multi-selection mode in the trash page
class KeepOnDeviceActionButton extends ConsumerWidget {
  final ActionSource source;
  final void Function(ActionResult result) onResult;

  const KeepOnDeviceActionButton({super.key, required this.source, required this.onResult});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }
    ref.read(assetViewerProvider.notifier).setControls(false);
    //todo STEP 2
    final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
    multiSelectNotifier.reset();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const iconData = Icons.cloud_off_outlined;
    return source == ActionSource.viewer
        ? BaseActionButton(
            maxWidth: 110.0,
            iconData: iconData,
            label: 'keep'.tr(),
            onPressed: () => _onTap(context, ref),
          )
        : TextButton.icon(
            icon: const Icon(iconData),
            label: Text('keep_on_device'.tr(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            onPressed: () => _onTap(context, ref),
          );
  }
}

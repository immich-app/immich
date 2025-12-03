import 'package:easy_localization/easy_localization.dart';
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

/// This deny move to trash action has the following behavior:
/// - Deny moving to the local trash those assets that are in the remote trash.
///
/// This action is used when the asset is selected in multi-selection mode in the trash page
class KeepOnDeviceActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool isPreview;

  const KeepOnDeviceActionButton({super.key, required this.source, required this.isPreview});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final actionNotifier = ref.read(actionProvider.notifier);
    final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
    final result = await actionNotifier.resolveRemoteTrash(source, allow: false);
    multiSelectNotifier.reset();

    if (source == ActionSource.viewer) {
      Future.delayed(Durations.extralong4, () {
        EventStream.shared.emit(const ViewerReloadAssetEvent());
        EventStream.shared.emit(const TimelineReloadEvent());
      });
    }

    if (context.mounted) {
      final successMessage = 'assets_denied_to_moved_to_trash_count'.t(
        context: context,
        args: {'count': result.count.toString()},
      );
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
    const iconData = Icons.cloud_off_outlined;
    return isPreview
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

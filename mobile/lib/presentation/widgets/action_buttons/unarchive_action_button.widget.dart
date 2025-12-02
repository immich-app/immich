// dart
// File: `lib/presentation/widgets/action_buttons/unarchive_action_button.widget.dart`
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';

// used to allow performing unarchive action from different sources (without duplicating code)
Future<void> performUnArchiveAction(BuildContext context, WidgetRef ref, {required ActionSource source}) async {
  if (!context.mounted) return;

  final result = await ref.read(actionProvider.notifier).unArchive(source);
  ref.read(multiSelectProvider.notifier).reset();

  if (source == ActionSource.viewer) {
    EventStream.shared.emit(const ViewerReloadAssetEvent());
  }

  final successMessage = 'unarchive_action_prompt'.t(context: context, args: {'count': result.count.toString()});

  if (context.mounted) {
    ImmichToast.show(
      context: context,
      msg: result.success ? successMessage : 'scaffold_body_error_occurred'.t(context: context),
      gravity: ToastGravity.BOTTOM,
      toastType: result.success ? ToastType.success : ToastType.error,
    );
  }
}

class UnArchiveActionButton extends ConsumerWidget {
  final ActionSource source;

  const UnArchiveActionButton({super.key, required this.source});

  Future<void> _onTap(BuildContext context, WidgetRef ref) async {
    await performUnArchiveAction(context, ref, source: source);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.unarchive_outlined,
      label: "unarchive".t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}

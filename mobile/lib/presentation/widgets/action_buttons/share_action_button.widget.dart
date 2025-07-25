import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class ShareActionButton extends ConsumerWidget {
  final ActionSource source;

  const ShareActionButton({super.key, required this.source});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final result = await ref.read(actionProvider.notifier).shareAssets(source);
    ref.read(multiSelectProvider.notifier).reset();

    if (!context.mounted) {
      return;
    }

    if (!result.success) {
      ImmichToast.show(
        context: context,
        msg: 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    } else if (result.count > 0) {
      ImmichToast.show(
        context: context,
        msg: 'share_action_prompt'.t(context: context, args: {'count': result.count.toString()}),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.success,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
      label: 'share'.t(context: context),
      onPressed: () => _onTap(context, ref),
    );
  }
}

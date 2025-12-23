import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class _SharePreparingDialog extends StatelessWidget {
  const _SharePreparingDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          Container(margin: const EdgeInsets.only(top: 12), child: const Text('share_dialog_preparing').tr()),
        ],
      ),
    );
  }
}

class ShareActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const ShareActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    await showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        ref.read(actionProvider.notifier).shareAssets(source, context).then((ActionResult result) {
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
          }

          buildContext.pop();
        });

        // show a loading spinner with a "Preparing" message
        return const _SharePreparingDialog();
      },
      barrierDismissible: false,
      useRootNavigator: false,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Platform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded,
      label: 'share'.t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}

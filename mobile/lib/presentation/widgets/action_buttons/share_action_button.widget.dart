import 'dart:async';
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
  final ValueNotifier<double?> progress;

  const _SharePreparingDialog({required this.progress});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(margin: const EdgeInsets.only(bottom: 12), child: const Text('share_dialog_preparing').tr()),
          SizedBox(
            width: 240,
            child: ValueListenableBuilder<double?>(
              valueListenable: progress,
              builder: (context, value, _) {
                final percent = value == null ? null : (value * 100).clamp(0, 100);
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    LinearProgressIndicator(value: value, minHeight: 8.0),
                    if (percent != null)
                      Container(margin: const EdgeInsets.only(top: 8), child: Text('${percent.toStringAsFixed(0)}%')),
                  ],
                );
              },
            ),
          ),
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

    final cancelCompleter = Completer<void>();
    final progress = ValueNotifier<double?>(null);
    final preparingDialog = _SharePreparingDialog(progress: progress);
    await showDialog(
      context: context,
      builder: (BuildContext buildContext) {
        ref
            .read(actionProvider.notifier)
            .shareAssets(
              source,
              context,
              cancelCompleter: cancelCompleter,
              onAssetDownloadProgress: (value) => progress.value = value,
            )
            .then((ActionResult result) {
              if (cancelCompleter.isCompleted || !context.mounted) {
                return;
              }

              ref.read(multiSelectProvider.notifier).reset();

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

        // Show download progress with a "Preparing" message
        return preparingDialog;
      },
      barrierDismissible: false,
      useRootNavigator: false,
    ).then((_) {
      if (!cancelCompleter.isCompleted) {
        cancelCompleter.complete();
      }
      progress.dispose();
    });
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

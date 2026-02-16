import 'dart:async';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';
import 'package:immich_ui/immich_ui.dart';

class UploadActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const UploadActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final isTimeline = source == ActionSource.timeline;
    List<LocalAsset>? assets;

    if (source == ActionSource.timeline) {
      assets = ref.read(multiSelectProvider).selectedAssets.whereType<LocalAsset>().toList();
      if (assets.isEmpty) {
        return;
      }
      ref.read(multiSelectProvider.notifier).reset();
    } else {
      unawaited(
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (dialogContext) => const _UploadProgressDialog(),
        ),
      );
    }

    final result = await ref.read(actionProvider.notifier).upload(source, assets: assets);

    if (!isTimeline && context.mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }

    if (context.mounted && !result.success) {
      ImmichToast.show(
        context: context,
        msg: 'scaffold_body_error_occurred'.t(context: context),
        gravity: ToastGravity.BOTTOM,
        toastType: ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return BaseActionButton(
      iconData: Icons.backup_outlined,
      label: "upload".t(context: context),
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
    );
  }
}

class _UploadProgressDialog extends ConsumerWidget {
  const _UploadProgressDialog();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressMap = ref.watch(assetUploadProgressProvider);

    // Calculate overall progress from all assets
    final values = progressMap.values.where((v) => v >= 0).toList();
    final progress = values.isEmpty ? 0.0 : values.reduce((a, b) => a + b) / values.length;
    final hasError = progressMap.values.any((v) => v < 0);
    final percentage = (progress * 100).toInt();

    return AlertDialog(
      title: Text('uploading'.t(context: context)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (hasError)
            const Icon(Icons.error_outline, color: Colors.red, size: 48)
          else
            CircularProgressIndicator(value: progress > 0 ? progress : null),
          const SizedBox(height: 16),
          Text(hasError ? 'Error' : '$percentage%'),
        ],
      ),
      actions: [
        ImmichTextButton(
          onPressed: () {
            ref.read(manualUploadCancelTokenProvider)?.complete();
            ref.read(manualUploadCancelTokenProvider.notifier).state = null;
            Navigator.of(context).pop();
          },
          labelText: 'cancel'.t(context: context),
        ),
      ],
    );
  }
}

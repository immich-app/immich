import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_current.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_file_path.provider.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
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
    final isViewIntentUpload =
        source == ActionSource.viewer && ref.read(timelineServiceProvider).origin == TimelineOrigin.deepLink;
    final viewIntentPayload = isViewIntentUpload ? ref.read(viewIntentCurrentProvider) : null;
    final viewerIntentFilePath = source == ActionSource.viewer ? ref.read(viewIntentFilePathProvider) : null;
    List<LocalAsset>? assets;
    var isUploadDialogOpen = false;
    var wasUploadCancelled = false;
    String? remoteAssetId;
    Future<void>? uploadDialogFuture;

    if (source == ActionSource.timeline) {
      assets = ref.read(multiSelectProvider).selectedAssets.whereType<LocalAsset>().toList();
      if (assets.isEmpty) {
        return;
      }
      ref.read(multiSelectProvider.notifier).reset();
    } else {
      isUploadDialogOpen = true;
      uploadDialogFuture =
          showDialog<void>(
            context: context,
            barrierDismissible: false,
            builder: (dialogContext) => _UploadProgressDialog(
              onCancel: () {
                wasUploadCancelled = true;
              },
            ),
          ).whenComplete(() {
            isUploadDialogOpen = false;
          });
      unawaited(uploadDialogFuture);
    }

    var success = false;
    if (!isTimeline && viewerIntentFilePath != null) {
      final viewIntentService = ref.read(viewIntentServiceProvider);
      viewIntentService.markUploadActive(viewerIntentFilePath);
      var hasError = false;
      try {
        await ref
            .read(foregroundUploadServiceProvider)
            .uploadShareIntent(
              [File(viewerIntentFilePath)],
              onSuccess: (_, uploadedRemoteAssetId) {
                remoteAssetId = uploadedRemoteAssetId;
              },
              onError: (_, _) {
                hasError = true;
              },
            );
      } finally {
        await viewIntentService.markUploadInactive(viewerIntentFilePath);
      }
      success = !hasError;
    } else {
      final result = await ref.read(actionProvider.notifier).upload(source, assets: assets);
      success = result.success;
      remoteAssetId = result.remoteAssetIds.isNotEmpty ? result.remoteAssetIds.first : null;
    }

    if (!isTimeline && context.mounted && isUploadDialogOpen) {
      Navigator.of(context, rootNavigator: true).pop();
    }

    if (success &&
        viewIntentPayload != null &&
        ref.read(viewIntentCurrentProvider) == viewIntentPayload &&
        remoteAssetId != null) {
      await ref
          .read(viewIntentHandlerProvider)
          .refreshCurrentAfterUpload(remoteAssetId: remoteAssetId!, attachment: viewIntentPayload);
    }

    if (context.mounted && !success && !wasUploadCancelled) {
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
  final VoidCallback onCancel;

  const _UploadProgressDialog({required this.onCancel});

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
            onCancel();
            Navigator.of(context, rootNavigator: true).pop();
          },
          labelText: 'cancel'.t(context: context),
        ),
      ],
    );
  }
}

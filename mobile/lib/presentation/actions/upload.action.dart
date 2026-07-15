import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/backup/asset_upload_progress.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/asset_filter.dart';
import 'package:immich_ui/immich_ui.dart';

class UploadAction extends BaseAction {
  final List<LocalAsset> assets;

  final bool showProgress;

  UploadAction._({required this.assets, required this.showProgress, required super.scope, super.isVisible})
    : super(icon: Icons.backup_outlined, label: scope.context.t.upload);

  factory UploadAction({required Iterable<BaseAsset> assets, required ActionScope scope, bool showProgress = false}) {
    final local = AssetFilter(assets).backedUp(isBackedUp: false).local().toList(growable: false);
    return ._(assets: local, scope: scope, showProgress: showProgress, isVisible: local.isNotEmpty);
  }

  @override
  Future<void> onAction() async {
    if (assets.isEmpty) {
      return;
    }

    if (!showProgress) {
      await upload();
      return;
    }

    final context = scope.context;
    var isDialogOpen = true;
    unawaited(
      showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) => const _UploadProgressDialog(),
      ).whenComplete(() => isDialogOpen = false),
    );

    await upload();

    if (isDialogOpen && context.mounted) {
      Navigator.of(context, rootNavigator: true).pop();
    }
  }

  @visibleForTesting
  Future<void> upload() async {
    final ActionScope(:context, :ref) = scope;
    final progress = ref.read(assetUploadProgressProvider.notifier);
    final cancelToken = Completer<void>();
    ref.read(manualUploadCancelTokenProvider.notifier).state = cancelToken;

    final uploaded = <String>{};
    final failed = <String>{};
    for (final asset in assets) {
      progress.setProgress(asset.id, 0.0);
    }

    try {
      await ref
          .read(foregroundUploadServiceProvider)
          .uploadManual(
            assets,
            cancelToken: cancelToken,
            callbacks: UploadCallbacks(
              onProgress: (id, _, bytes, total) => progress.setProgress(id, total > 0 ? bytes / total : 0.0),
              onSuccess: (id, _) {
                uploaded.add(id);
                progress.remove(id);
              },
              onError: (id, _) {
                failed.add(id);
                progress.setError(id);
              },
            ),
          );
    } finally {
      ref.read(manualUploadCancelTokenProvider.notifier).state = null;
    }

    final uploadedCount = uploaded.difference(failed).length;
    final wasCancelled = cancelToken.isCompleted;
    if (!wasCancelled && (uploadedCount != assets.length || failed.isNotEmpty)) {
      ref.read(toastRepositoryProvider).error(context.t.scaffold_body_error_occurred);
    }

    unawaited(Future.delayed(const Duration(seconds: 2), progress.clear));
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
      title: Text(context.t.uploading),
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
            Navigator.of(context, rootNavigator: true).pop();
          },
          labelText: context.t.cancel,
        ),
      ],
    );
  }
}

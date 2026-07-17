import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';

class ShareAction extends BaseAction {
  const ShareAction();

  @override
  IconData icon(_) => CurrentPlatform.isAndroid ? Icons.share_rounded : Icons.ios_share_rounded;

  @override
  String label(context) => context.t.share;

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => assets.isNotEmpty;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) =>
      _share(ref, assets, ref.read(appConfigProvider).share.fileType);

  @override
  Future<void> Function(WidgetRef ref, Iterable<BaseAsset> assets)? get onSecondaryAction => _promptQualityAndShare;

  Future<void> _promptQualityAndShare(WidgetRef ref, Iterable<BaseAsset> assets) async {
    final context = ref.context;

    // only show preview option when at least one of the assets is not a video
    // we cant share previews of videos
    final showPreview = assets.isEmpty || assets.any((asset) => !asset.isVideo);

    final fileType = await showDialog<ShareAssetType>(
      context: context,
      builder: (_) => _ShareFileTypeDialog(showPreview: showPreview),
      useRootNavigator: false,
    );

    if (fileType == null || !context.mounted) {
      return;
    }

    await ref.read(settingsProvider).write(.shareFileType, fileType);

    if (!context.mounted) {
      return;
    }

    await _share(ref, assets, fileType);
  }

  Future<void> _share(WidgetRef ref, Iterable<BaseAsset> assets, ShareAssetType fileType) async {
    final context = ref.context;
    final cancelCompleter = Completer<void>();
    final progress = ValueNotifier<double?>(null);

    await showDialog(
      context: context,
      barrierDismissible: false,
      useRootNavigator: false,
      builder: (dialogContext) {
        void finish({required bool failed}) {
          if (cancelCompleter.isCompleted || !dialogContext.mounted) {
            return;
          }
          if (failed) {
            ref.read(toastRepositoryProvider).error(context.t.scaffold_body_error_occurred);
          }
          dialogContext.pop();
        }

        unawaited(
          ref
              .read(assetMediaRepositoryProvider)
              .shareAssets(
                assets.toList(growable: false),
                context,
                fileType: fileType,
                cancelCompleter: cancelCompleter,
                onAssetDownloadProgress: (value) => progress.value = value,
              )
              .then<void>(
                (count) => finish(failed: count == 0 && assets.isNotEmpty),
                onError: (_) => finish(failed: true),
              ),
        );

        // Show download progress with a "Preparing" message
        return _SharePreparingDialog(progress: progress);
      },
    ).then((_) {
      if (!cancelCompleter.isCompleted) {
        cancelCompleter.complete();
      }
      progress.dispose();
    });
  }
}

class _SharePreparingDialog extends StatelessWidget {
  final ValueNotifier<double?> progress;

  const _SharePreparingDialog({required this.progress});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      content: Column(
        mainAxisSize: .min,
        children: [
          Container(margin: const .only(bottom: 12), child: Text(context.t.share_dialog_preparing)),
          SizedBox(
            width: 240,
            child: ValueListenableBuilder<double?>(
              valueListenable: progress,
              builder: (context, value, _) {
                final percent = value == null ? null : (value * 100).clamp(0, 100);
                return Column(
                  mainAxisSize: .min,
                  children: [
                    LinearProgressIndicator(value: value, minHeight: 8.0),
                    if (percent != null)
                      Container(margin: const .only(top: 8), child: Text('${percent.toStringAsFixed(0)}%')),
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

class _ShareFileTypeDialog extends StatelessWidget {
  final bool showPreview;

  const _ShareFileTypeDialog({this.showPreview = true});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(context.t.select_quality),
      contentPadding: const .symmetric(vertical: 8),
      content: Column(
        mainAxisSize: .min,
        children: [
          ListTile(
            leading: const Icon(Icons.high_quality_rounded),
            title: Text(context.t.share_original),
            onTap: () => context.pop(ShareAssetType.original),
          ),
          if (showPreview)
            ListTile(
              leading: const Icon(Icons.photo_size_select_large_rounded),
              title: Text(context.t.share_preview),
              onTap: () => context.pop(ShareAssetType.preview),
            ),
        ],
      ),
      actions: [TextButton(onPressed: () => context.pop(), child: Text(context.t.cancel))],
    );
  }
}

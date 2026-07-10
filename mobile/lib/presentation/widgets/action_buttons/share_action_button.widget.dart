import 'dart:async';
import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/settings_key.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
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

class _ShareFileTypeDialog extends StatelessWidget {
  final bool showPreview;

  const _ShareFileTypeDialog({this.showPreview = true});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(context.t.select_quality),
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      content: Column(
        mainAxisSize: MainAxisSize.min,
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

class ShareActionButton extends ConsumerWidget {
  final ActionSource source;
  final bool iconOnly;
  final bool menuItem;

  const ShareActionButton({super.key, required this.source, this.iconOnly = false, this.menuItem = false});

  Set<BaseAsset> _getSelectedAssets(WidgetRef ref) {
    return switch (source) {
      ActionSource.timeline => ref.read(multiSelectProvider).selectedAssets,
      ActionSource.viewer => switch (ref.read(assetViewerProvider).currentAsset) {
        BaseAsset asset => {asset},
        null => const {},
      },
    };
  }

  void _onTap(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    final fileType = ref.read(appConfigProvider).share.fileType;
    await _share(context, ref, fileType);
  }

  void _onLongPress(BuildContext context, WidgetRef ref) async {
    if (!context.mounted) {
      return;
    }

    // only show preview option when at least one of the assets is not a video
    // we cant share previews of videos
    final assets = _getSelectedAssets(ref);
    final showPreview = assets.isEmpty || assets.any((asset) => !asset.isVideo);

    final fileType = await showDialog<ShareAssetType>(
      context: context,
      builder: (_) => _ShareFileTypeDialog(showPreview: showPreview),
      useRootNavigator: false,
    );

    if (fileType == null || !context.mounted) {
      return;
    }

    await ref.read(settingsProvider).write(SettingsKey.shareFileType, fileType);

    if (!context.mounted) {
      return;
    }

    await _share(context, ref, fileType);
  }

  Future<void> _share(BuildContext context, WidgetRef ref, ShareAssetType fileType) async {
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
              fileType: fileType,
              cancelCompleter: cancelCompleter,
              onAssetDownloadProgress: (value) => progress.value = value,
            )
            .then((ActionResult result) {
              if (cancelCompleter.isCompleted || !context.mounted) {
                return;
              }

              if (!result.success) {
                ImmichToast.show(
                  context: context,
                  msg: context.t.scaffold_body_error_occurred,
                  gravity: ToastGravity.BOTTOM,
                  toastType: ToastType.error,
                );
              }

              buildContext.pop();
            });

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
      label: context.t.share,
      iconOnly: iconOnly,
      menuItem: menuItem,
      onPressed: () => _onTap(context, ref),
      onLongPressed: () => _onLongPress(context, ref),
    );
  }
}

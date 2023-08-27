import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/services/share.service.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:immich_mobile/shared/ui/share_dialog.dart';

void handleShareAssets(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection,
) {
  showDialog(
    context: context,
    builder: (BuildContext buildContext) {
      ref
          .watch(shareServiceProvider)
          .shareAssets(selection.toList())
          .then((_) => Navigator.of(buildContext).pop());
      return const ShareDialog();
    },
    barrierDismissible: false,
  );
}

Future<void> handleArchiveAssets(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection, {
  bool shouldArchive = true,
  ToastGravity toastGravity = ToastGravity.BOTTOM,
}) async {
  if (selection.isNotEmpty) {
    await ref
        .read(assetProvider.notifier)
        .toggleArchive(selection, shouldArchive);

    final assetOrAssets = selection.length > 1 ? 'assets' : 'asset';
    final archiveOrLibrary = shouldArchive ? 'archive' : 'library';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: 'Moved ${selection.length} $assetOrAssets to $archiveOrLibrary',
        gravity: toastGravity,
      );
    }
  }
}

Future<void> handleFavoriteAssets(
  WidgetRef ref,
  BuildContext context,
  List<Asset> selection, {
  bool shouldFavorite = true,
  ToastGravity toastGravity = ToastGravity.BOTTOM,
}) async {
  if (selection.isNotEmpty) {
    await ref
        .watch(assetProvider.notifier)
        .toggleFavorite(selection, shouldFavorite);

    final assetOrAssets = selection.length > 1 ? 'assets' : 'asset';
    final toastMessage = shouldFavorite
        ? 'Added ${selection.length} $assetOrAssets to favorites'
        : 'Removed ${selection.length} $assetOrAssets from favorites';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: toastMessage,
        gravity: ToastGravity.BOTTOM,
      );
    }
  }
}

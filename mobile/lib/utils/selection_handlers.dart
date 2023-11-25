import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
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
      ref.watch(shareServiceProvider).shareAssets(selection.toList()).then(
        (bool status) {
          if (!status) {
            ImmichToast.show(
              context: context,
              msg: 'image_viewer_page_state_provider_share_error'.tr(),
              toastType: ToastType.error,
              gravity: ToastGravity.BOTTOM,
            );
          }
          buildContext.pop();
        },
      );
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

    final toastMessage = shouldArchive
        ? 'selection_handler_move_assets_to_archive'
        : 'selection_handler_move_assets_to_library';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: toastMessage.plural(selection.length),
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

    final toastMessage = shouldFavorite
        ? 'selection_handler_add_assets_to_favorites'
        : 'selection_handler_remove_assets_from_favorites';
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: toastMessage.plural(selection.length),
        gravity: ToastGravity.BOTTOM,
      );
    }
  }
}

import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/action.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

/// Adds [selectedAssets] to [album], uploading any local assets through the
/// manual upload flow (so the timeline thumbnails show progress) and linking
/// each one to the album as its upload finishes.
Future<void> addSelectedAssetsToAlbum(
  BuildContext context,
  WidgetRef ref,
  RemoteAlbum album,
  List<BaseAsset> selectedAssets,
) async {
  if (selectedAssets.isEmpty) {
    return;
  }

  final candidates = RemoteAlbumService.categorizeCandidates(selectedAssets);
  final remoteIds = candidates.remoteAssetIds;
  final localAssets = candidates.localAssetsToUpload;

  // Capture notifiers up front: the WidgetRef is tied to the calling widget
  // and may be disposed (e.g., when the bottom sheet closes) before the
  // background upload callbacks fire.
  final albumNotifier = ref.read(remoteAlbumProvider.notifier);
  final actionNotifier = ref.read(actionProvider.notifier);

  // Clear multi-select so the timeline tiles can render upload progress overlays.
  ref.read(multiSelectProvider.notifier).reset();

  int addedRemote = 0;
  if (remoteIds.isNotEmpty) {
    try {
      addedRemote = await albumNotifier.addAssets(album.id, remoteIds);
    } catch (_) {
      if (context.mounted) {
        ImmichToast.show(context: context, msg: 'scaffold_body_error_occurred'.tr(), toastType: ToastType.error);
      }
      return;
    }
  }

  if (localAssets.isEmpty) {
    if (context.mounted) {
      ImmichToast.show(
        context: context,
        msg: addedRemote == 0
            ? 'add_to_album_bottom_sheet_already_exists'.tr(namedArgs: {'album': album.name})
            : 'add_to_album_bottom_sheet_added'.tr(namedArgs: {'album': album.name}),
      );
    }
    return;
  }

  final result = await actionNotifier.upload(
    ActionSource.timeline,
    assets: localAssets,
    onAssetUploaded: (asset, remoteId) async {
      final added = await albumNotifier.linkUploadedAssetToAlbum(album.id, asset, remoteId);
      if (added == 0) {
        throw StateError('Uploaded asset was not added to album ${album.id}');
      }
    },
  );

  if (!context.mounted) {
    return;
  }

  if (!result.success) {
    ImmichToast.show(context: context, msg: 'scaffold_body_error_occurred'.tr(), toastType: ToastType.error);
    return;
  }

  ImmichToast.show(
    context: context,
    msg: 'add_to_album_bottom_sheet_added'.tr(namedArgs: {'album': album.name}),
  );
}

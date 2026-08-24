import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/upload.action.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/utils/error_handler.dart';

class AddToAlbumAction extends AssetActionBuilder {
  const AddToAlbumAction({required super.source});

  @override
  ActionItem? create(BuildContext context, WidgetRef ref) {
    if (ref.watch(assetsActionProvider(source)).isEmpty) {
      return null;
    }

    return .new(icon: Icons.photo_album_outlined, label: context.t.album, onAction: () => _selectAlbum(context, ref));
  }

  Future<void> _selectAlbum(BuildContext context, WidgetRef ref) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => BaseBottomSheet(
        actions: const [],
        slivers: [
          const CreateAlbumButton(),
          AlbumSelector(
            onAlbumSelected: (album) async {
              await addAssetsToAlbum(context, ref, source, album);
              if (context.mounted) {
                await Navigator.of(context).maybePop();
              }
            },
          ),
        ],
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.95,
        expand: false,
        backgroundColor: context.isDarkTheme ? Colors.black : Colors.white,
      ),
    );
  }
}

/// Adds the current [source] selection to [album]
Future<void> addAssetsToAlbum(BuildContext context, WidgetRef ref, ActionSource source, RemoteAlbum album) async {
  final assets = ref.read(assetsActionProvider(source));
  if (assets.isEmpty) {
    return;
  }

  final albumNotifier = ref.read(remoteAlbumProvider.notifier);
  final clearSelection = ref.read(clearSelectionProvider(source));
  final candidates = RemoteAlbumService.categorizeCandidates(assets);

  int added = 0;
  Map<AlbumAddFailureReason, int> failureReasons = const {};
  if (candidates.remoteAssetIds.isNotEmpty) {
    try {
      final result = await albumNotifier.addAssets(album.id, candidates.remoteAssetIds);
      added = result.added;
      failureReasons = result.failureReasons;
    } catch (error, stack) {
      handleError(error, stack: stack, description: 'Failed to add assets to album ${album.id}');
      return;
    }
  }

  clearSelection();

  int linkFailed = 0;
  if (candidates.localAssetsToUpload.isNotEmpty && context.mounted) {
    try {
      final uploadResult = await uploadAssets(
        context,
        ref,
        candidates.localAssetsToUpload,
        onAssetUploaded: (asset, remoteId) => albumNotifier.linkUploadedAssetToAlbum(album.id, asset, remoteId),
      );
      added += uploadResult.uploaded;
      linkFailed = uploadResult.callbackFailed;
    } catch (error, stack) {
      handleError(error, stack: stack, description: 'Failed to upload assets for album ${album.id}');
    }
  }

  if (context.mounted) {
    if (added > 0) {
      ref.invalidate(albumsContainingAssetProvider);
    }
    await _showResultToast(context, ref, album, added, linkFailed, failureReasons);
  }
}

Future<void> _showResultToast(
  BuildContext context,
  WidgetRef ref,
  RemoteAlbum album,
  int added,
  int linkFailed,
  Map<AlbumAddFailureReason, int> failureReasons,
) async {
  final toastService = ref.read(toastServiceProvider);
  final duplicates = failureReasons[AlbumAddFailureReason.duplicate] ?? 0;
  final noPermission = failureReasons[AlbumAddFailureReason.noPermission] ?? 0;
  final notFound = failureReasons[AlbumAddFailureReason.notFound] ?? 0;

  if (added > 0 && duplicates > 0) {
    await toastService.info(
      context.t.add_to_album_bottom_sheet_conflicts(added: added, album: album.name, failed: duplicates),
    );
  } else if (added > 0) {
    await toastService.success(context.t.add_to_album_bottom_sheet_added(album: album.name));
  } else if (duplicates > 0) {
    await toastService.info(context.t.add_to_album_bottom_sheet_already_exists(album: album.name));
  } else if (noPermission > 0) {
    await toastService.error(context.t.errors.add_to_album_no_permission);
  } else if (notFound > 0) {
    await toastService.error(context.t.errors.add_to_album_not_found);
  } else if (failureReasons.isNotEmpty) {
    await toastService.error(context.t.scaffold_body_error_occurred);
  }

  if (linkFailed > 0 && context.mounted) {
    await toastService.error(
      context.t.add_to_album_bottom_sheet_uploaded_not_added(count: linkFailed, album: album.name),
    );
  }
}

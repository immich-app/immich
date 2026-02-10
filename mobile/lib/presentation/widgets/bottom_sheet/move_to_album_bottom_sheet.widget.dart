import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_exclusion.repository.dart';
import 'package:immich_mobile/presentation/widgets/album/album_selector.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/base_bottom_sheet.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/common/immich_toast.dart';

class MoveToAlbumBottomSheet extends ConsumerStatefulWidget {
  final String? sourceAlbumId;
  final Set<BaseAsset> assets;
  final VoidCallback? onMoveSuccess;

  const MoveToAlbumBottomSheet({super.key, this.sourceAlbumId, required this.assets, this.onMoveSuccess});

  @override
  ConsumerState<MoveToAlbumBottomSheet> createState() => _MoveToAlbumBottomSheetState();
}

class _MoveToAlbumBottomSheetState extends ConsumerState<MoveToAlbumBottomSheet> {
  late DraggableScrollableController sheetController;

  @override
  void initState() {
    super.initState();
    sheetController = DraggableScrollableController();
  }

  @override
  void dispose() {
    sheetController.dispose();
    super.dispose();
  }

  Future<void> onAlbumSelected(RemoteAlbum destinationAlbum) async {
    if (destinationAlbum.id == widget.sourceAlbumId) {
      ImmichToast.show(
        context: context,
        msg: 'move_to_same_album_error'.t(context: context), // Source and dest same
        toastType: ToastType.error,
      );
      return;
    }

    final assetIds = <String>[];
    for (final asset in widget.assets) {
      if (asset is RemoteAsset) {
        assetIds.add(asset.id);
      } else if (asset is LocalAsset && asset.remoteId != null) {
        assetIds.add(asset.remoteId!);
      }
    }

    if (assetIds.isEmpty) return;

    try {
      // 1. Add to destination
      final addedCount = await ref.read(remoteAlbumProvider.notifier).addAssets(destinationAlbum.id, assetIds);

      if (addedCount > 0) {
        // 2. Remove from source(s)
        if (widget.sourceAlbumId != null) {
          await ref.read(remoteAlbumProvider.notifier).removeAssets(widget.sourceAlbumId!, assetIds);

          // 3. Track sync exclusions if setting is enabled
          await _trackSyncExclusions(widget.sourceAlbumId!, assetIds);
        } else {
          // Global Move: Remove from all current albums
          final remoteAlbumService = ref.read(remoteAlbumServiceProvider);
          for (final assetId in assetIds) {
            try {
              final containingAlbums = await remoteAlbumService.getAlbumsContainingAssetFromServer(assetId);
              for (final album in containingAlbums) {
                if (album.id != destinationAlbum.id) {
                  await ref.read(remoteAlbumProvider.notifier).removeAssets(album.id, [assetId]);
                  // Track sync exclusion for this album too
                  await _trackSyncExclusions(album.id, [assetId]);
                }
              }
            } catch (e) {
              debugPrint("Error moving asset $assetId: $e");
              if (mounted) {
                ImmichToast.show(context: context, msg: 'Error moving from old album: $e', toastType: ToastType.error);
              }
            }
          }
        }

        if (mounted) {
          ImmichToast.show(
            context: context,
            msg: 'add_to_album_bottom_sheet_added'.t(context: context, args: {"album": destinationAlbum.name}),
            toastType: ToastType.success,
          );

          widget.onMoveSuccess?.call();
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      if (mounted) {
        ImmichToast.show(
          context: context,
          msg: 'error'.t(context: context),
          toastType: ToastType.error,
        );
      }
    }
  }

  /// Track sync exclusions when assets are moved out of an album
  /// This prevents assets from being re-synced back to local albums after moving
  Future<void> _trackSyncExclusions(String remoteAlbumId, List<String> assetIds) async {
    print("DEBUG _trackSyncExclusions: Called with remoteAlbumId=$remoteAlbumId, ${assetIds.length} assets");
    try {
      // Check if sync exclusions are enabled
      final enableSyncExclusions = Store.get(AppSettingsEnum.enableSyncExclusions.storeKey, true);
      print("DEBUG _trackSyncExclusions: enableSyncExclusions=$enableSyncExclusions");
      if (!enableSyncExclusions) {
        print("DEBUG _trackSyncExclusions: Sync exclusions disabled, skipping");
        return;
      }

      // Check if this remote album is linked to a local album
      final localAlbumRepo = ref.read(localAlbumRepository);
      print("DEBUG _trackSyncExclusions: Looking for local album linked to remote $remoteAlbumId");
      final linkedLocalAlbum = await localAlbumRepo.getByLinkedRemoteAlbumId(remoteAlbumId);
      print(
        "DEBUG _trackSyncExclusions: linkedLocalAlbum=${linkedLocalAlbum?.name ?? 'NULL'} (id=${linkedLocalAlbum?.id})",
      );

      if (linkedLocalAlbum != null) {
        // Record exclusions to prevent re-sync
        print("DEBUG _trackSyncExclusions: Recording exclusions for assetIds: $assetIds");
        final syncExclusionRepo = ref.read(syncExclusionRepositoryProvider);
        await syncExclusionRepo.addExclusions(assetIds, linkedLocalAlbum.id);
        print(
          "DEBUG _trackSyncExclusions: SUCCESS - Recorded ${assetIds.length} sync exclusions for local album: ${linkedLocalAlbum.name}",
        );
      } else {
        print("DEBUG _trackSyncExclusions: No linked local album found, skipping exclusion");
      }
    } catch (e) {
      // Don't fail the move operation if exclusion tracking fails
      print("DEBUG _trackSyncExclusions: ERROR - $e");
      debugPrint("Error tracking sync exclusions: $e");
    }
  }

  Future<void> onKeyboardExpand() {
    return sheetController.animateTo(0.85, duration: const Duration(milliseconds: 200), curve: Curves.easeInOut);
  }

  @override
  Widget build(BuildContext context) {
    return BaseBottomSheet(
      actions: const [],
      controller: sheetController,
      initialChildSize: 0.6,
      minChildSize: 0.4,
      maxChildSize: 0.85,
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Text('move_to_album'.t(context: context), style: context.textTheme.titleMedium),
          ),
        ),
        AlbumSelector(onAlbumSelected: onAlbumSelected, onKeyboardExpanded: onKeyboardExpand),
      ],
    );
  }
}

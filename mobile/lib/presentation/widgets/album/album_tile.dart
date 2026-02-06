import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

import 'package:flutter_hooks/flutter_hooks.dart';

class AlbumTile extends HookConsumerWidget {
  const AlbumTile({super.key, required this.album, required this.isOwner, this.onAlbumSelected});

  final RemoteAlbum album;
  final bool isOwner;
  final Function(RemoteAlbum)? onAlbumSelected;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albumThumbnailAssetFuture = useMemoized(() async {
      if (album.thumbnailAssetId != null && album.thumbnailAssetId!.isNotEmpty) {
        final thumbnailAsset = await ref.read(assetServiceProvider).getRemoteAsset(album.thumbnailAssetId!);
        // If the thumbnail asset is trashed (deletedAt != null), fallback to newest non-trashed asset
        if (thumbnailAsset != null && thumbnailAsset.deletedAt == null) {
          return thumbnailAsset;
        }
      }
      // Fallback: get newest non-trashed asset (getNewestAsset already filters trashed)
      return ref.read(remoteAlbumServiceProvider).getNewestAsset(album.id);
    }, [album.id, album.thumbnailAssetId, album.assetCount, album.updatedAt]);

    final albumThumbnailAsset = useFuture(albumThumbnailAssetFuture);

    return LargeLeadingTile(
      title: Text(
        album.name,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: context.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(
        '${'items_count'.t(context: context, args: {'count': album.assetCount})} • ${isOwner ? 'owned'.t(context: context) : 'shared_by_user'.t(context: context, args: {'user': album.ownerName})}',
        overflow: TextOverflow.ellipsis,
        style: context.textTheme.bodyMedium?.copyWith(color: context.colorScheme.onSurfaceSecondary),
      ),
      onTap: () => onAlbumSelected?.call(album),
      leadingPadding: const EdgeInsets.only(right: 16),
      leading: albumThumbnailAsset.hasData && albumThumbnailAsset.data != null
          ? ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(15)),
              child: SizedBox(width: 80, height: 80, child: Thumbnail.fromAsset(asset: albumThumbnailAsset.data!)),
            )
          : SizedBox(
              width: 80,
              height: 80,
              child: Container(
                decoration: BoxDecoration(
                  color: context.colorScheme.surfaceContainer,
                  borderRadius: const BorderRadius.all(Radius.circular(16)),
                  border: Border.all(color: context.colorScheme.outline.withAlpha(50), width: 1),
                ),
                child: const Icon(Icons.photo_album_rounded, size: 24, color: Colors.grey),
              ),
            ),
    );
  }
}

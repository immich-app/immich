import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';

class AlbumTile extends StatelessWidget {
  const AlbumTile({super.key, required this.album, required this.isOwner, this.onAlbumSelected});

  final RemoteAlbum album;
  final bool isOwner;
  final Function(RemoteAlbum)? onAlbumSelected;

  @override
  Widget build(BuildContext context) {
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
      leading: album.thumbnailAssetId != null
          ? ClipRRect(
              borderRadius: const BorderRadius.all(Radius.circular(15)),
              child: SizedBox(width: 80, height: 80, child: Thumbnail.remote(remoteId: album.thumbnailAssetId!)),
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

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/widgets/album/album_viewer_editable_title.dart';
import 'package:immich_mobile/providers/auth.provider.dart';

class AlbumTitle extends ConsumerWidget {
  const AlbumTitle({super.key, required this.titleFocusNode});

  final FocusNode titleFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(authProvider).userId;
    final (isOwner, isRemote, albumName) = ref.watch(
      currentAlbumProvider.select((album) {
        if (album == null) {
          return const (false, false, '');
        }

        return (album.ownerId == userId, album.isRemote, album.name);
      }),
    );

    if (isOwner && isRemote) {
      return Padding(
        padding: const EdgeInsets.only(left: 8, right: 8),
        child: AlbumViewerEditableTitle(
          albumName: albumName,
          titleFocusNode: titleFocusNode,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 8),
      child: Text(albumName, style: context.textTheme.headlineMedium),
    );
  }
}

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/current_album.provider.dart';
import 'package:immich_mobile/widgets/album/album_viewer_editable_description.dart';
import 'package:immich_mobile/providers/auth.provider.dart';

class AlbumDescription extends ConsumerWidget {
  const AlbumDescription({super.key, required this.descriptionFocusNode});

  final FocusNode descriptionFocusNode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(authProvider).userId;
    final (isOwner, isRemote, albumDescription) = ref.watch(
      currentAlbumProvider.select((album) {
        if (album == null) {
          return const (false, false, '');
        }

        return (album.ownerId == userId, album.isRemote, album.description);
      }),
    );

    if (isOwner && isRemote) {
      return Padding(
        padding: const EdgeInsets.only(left: 8, right: 8),
        child: AlbumViewerEditableDescription(
          albumDescription: albumDescription ?? 'add_a_description'.tr(),
          descriptionFocusNode: descriptionFocusNode,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 8),
      child: Text(
        albumDescription ?? 'add_a_description'.tr(),
        style: context.textTheme.bodyLarge,
      ),
    );
  }
}

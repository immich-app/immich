import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail.widget.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

class LocalAlbumThumbnail extends ConsumerWidget {
  const LocalAlbumThumbnail({
    super.key,
    required this.albumId,
  });

  final String albumId;
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localAlbumThumbnail = ref.watch(localAlbumThumbnailProvider(albumId));
    return localAlbumThumbnail.when(
      data: (data) {
        if (data == null) {
          return Container(
            decoration: BoxDecoration(
              color: context.colorScheme.surfaceContainer,
              borderRadius: const BorderRadius.all(Radius.circular(16)),
              border: Border.all(
                color: context.colorScheme.outline.withAlpha(50),
                width: 1,
              ),
            ),
            child: Icon(
              Icons.collections,
              size: 24,
              color: context.primaryColor,
            ),
          );
        }

        return ClipRRect(
          borderRadius: const BorderRadius.all(Radius.circular(16)),
          child: Thumbnail(
            asset: data,
          ),
        );
      },
      error: (error, stack) {
        return const Icon(Icons.error, size: 24);
      },
      loading: () => const SizedBox(
        width: 24,
        height: 24,
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

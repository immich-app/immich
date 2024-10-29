import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/repositories/album_media.repository.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

@RoutePage()
class AlbumPreviewPage extends HookConsumerWidget {
  final Album album;
  const AlbumPreviewPage({super.key, required this.album});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = useState<List<Asset>>([]);

    getAssetsInAlbum() async {
      assets.value = await ref
          .read(albumMediaRepositoryProvider)
          .getAssets(album.localId!);
    }

    useEffect(
      () {
        getAssetsInAlbum();
        return null;
      },
      [],
    );

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Column(
          children: [
            Text(
              album.name,
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                "ID ${album.id}",
                style: TextStyle(
                  fontSize: 10,
                  color: context.colorScheme.onSurfaceSecondary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        leading: IconButton(
          onPressed: () => context.maybePop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
      ),
      body: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          crossAxisSpacing: 2,
          mainAxisSpacing: 2,
        ),
        itemCount: assets.value.length,
        itemBuilder: (context, index) {
          return ImmichThumbnail(
            asset: assets.value[index],
            width: 100,
            height: 100,
          );
        },
      ),
    );
  }
}

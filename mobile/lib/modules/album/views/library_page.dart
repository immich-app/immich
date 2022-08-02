import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:openapi/api.dart';
import 'package:transparent_image/transparent_image.dart';

class LibraryPage extends HookConsumerWidget {
  const LibraryPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);

    useEffect(
      () {
        ref.read(albumProvider.notifier).getAllAlbums();
        return null;
      },
      [],
    );

    Widget _buildAppBar() {
      return SliverAppBar(
        centerTitle: true,
        floating: false,
        pinned: true,
        snap: false,
        automaticallyImplyLeading: false,
        title: Text(
          'IMMICH',
          style: TextStyle(
            fontFamily: 'SnowburstOne',
            fontWeight: FontWeight.bold,
            fontSize: 22,
            color: Theme.of(context).primaryColor,
          ),
        ),
      );
    }

    Widget _buildCreateAlbumButton() {
      return Column(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: MediaQuery.of(context).size.width / 2 - 18,
            height: MediaQuery.of(context).size.width / 2 - 18,
            decoration: BoxDecoration(
              border: Border.all(
                color: Colors.grey,
              ),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
              child: Icon(Icons.add),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(top: 8.0),
            child: Text(
              "New album",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          )
        ],
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(12.0),
              child: Text(
                "Albums",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.only(left: 12.0, right: 12, bottom: 50),
            sliver: SliverToBoxAdapter(
              child: Wrap(
                spacing: 12,
                children: [
                  _buildCreateAlbumButton(),
                  for (var album in albums)
                    AlbumInfoCard(
                      album: album,
                    ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}

class AlbumInfoCard extends HookConsumerWidget {
  const AlbumInfoCard({Key? key, required this.album}) : super(key: key);

  final AlbumResponseDto album;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    var albumThumbnailUrl =
        '${box.get(serverEndpointKey)}/asset/thumbnail/${album.albumThumbnailAssetId}?format=JPEG';

    return Padding(
      padding: const EdgeInsets.only(bottom: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: FadeInImage(
              width: MediaQuery.of(context).size.width / 2 - 18,
              height: MediaQuery.of(context).size.width / 2 - 18,
              fit: BoxFit.cover,
              placeholder: MemoryImage(kTransparentImage),
              image: NetworkImage(
                albumThumbnailUrl,
                headers: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
              ),
              fadeInDuration: const Duration(milliseconds: 200),
              fadeOutDuration: const Duration(milliseconds: 200),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(top: 8.0),
            child: Text(
              album.albumName,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

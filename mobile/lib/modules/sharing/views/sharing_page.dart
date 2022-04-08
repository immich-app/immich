import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/sharing/models/shared_album.model.dart';
import 'package:immich_mobile/modules/sharing/providers/shared_album.provider.dart';
import 'package:immich_mobile/modules/sharing/ui/sharing_sliver_appbar.dart';

class SharingPage extends HookConsumerWidget {
  const SharingPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    var box = Hive.box(userInfoBox);
    var thumbnailRequestUrl = '${box.get(serverEndpointKey)}/asset/thumbnail';
    final List<SharedAlbum> sharedAlbums = ref.watch(sharedAlbumProvider);

    useEffect(() {
      ref.read(sharedAlbumProvider.notifier).getAllSharedAlbums();

      return null;
    }, []);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SharingSliverAppBar(),
          const SliverPadding(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            sliver: SliverToBoxAdapter(
              child: Text(
                "Shared albums",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (BuildContext context, int index) {
                String thumbnailUrl = sharedAlbums[index].albumThumbnailAssetId != null
                    ? "$thumbnailRequestUrl/${sharedAlbums[index].albumThumbnailAssetId}"
                    : "https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8Ymxhbmt8ZW58MHx8MHx8&auto=format&fit=crop&w=700&q=60";

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                  leading: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      thumbnailUrl,
                      headers: {"Authorization": "Bearer ${box.get(accessTokenKey)}"},
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                  title: Text(
                    sharedAlbums[index].albumName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 14),
                  ),
                  onTap: () {
                    debugPrint(
                        "Navigating to album ${sharedAlbums[index].id} with thumb id ${sharedAlbums[index].albumThumbnailAssetId}");
                  },
                );
              },
              childCount: sharedAlbums.length,
            ),
          )
        ],
      ),
    );
  }
}

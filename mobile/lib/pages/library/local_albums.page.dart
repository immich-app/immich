import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/pages/common/large_leading_tile.dart';
import 'package:immich_mobile/providers/album/album.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

@RoutePage()
class LocalAlbumsPage extends HookConsumerWidget {
  const LocalAlbumsPage({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(localAlbumsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('on_this_device'.tr()),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(18.0),
        itemCount: albums.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8.0),
            child: LargeLeadingTile(
              leadingPadding: const EdgeInsets.only(
                right: 16,
              ),
              leading: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(15)),
                child: ImmichThumbnail(
                  asset: albums[index].thumbnail.value,
                  width: 80,
                  height: 80,
                ),
              ),
              title: Text(
                albums[index].name,
                style: context.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text('${albums[index].assetCount} items'),
              onTap: () => context
                  .pushRoute(AlbumViewerRoute(albumId: albums[index].id)),
            ),
          );
        },
      ),
    );
  }
}

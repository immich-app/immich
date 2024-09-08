import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/album/albumv2.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/immich_thumbnail.dart';

@RoutePage()
class LocalAlbumsCollectionPage extends HookConsumerWidget {
  const LocalAlbumsCollectionPage({super.key});
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
            child: ListTile(
              contentPadding: const EdgeInsets.all(0),
              dense: false,
              visualDensity: VisualDensity.comfortable,
              leading: ClipRRect(
                borderRadius: const BorderRadius.all(Radius.circular(15)),
                child: ImmichThumbnail(
                  asset: albums[index].thumbnail.value,
                  width: 60,
                  height: 90,
                ),
              ),
              minVerticalPadding: 1,
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

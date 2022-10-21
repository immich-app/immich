import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/providers/album.provider.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/modules/home/ui/add_to_album/album_list_entry.dart';
import 'package:immich_mobile/shared/ui/immich_toast.dart';
import 'package:openapi/api.dart';

class AddToAlbumDialog extends HookConsumerWidget {
  final Set<AssetResponseDto> assets;
  final void Function(String albumName) onSucess;

  const AddToAlbumDialog(this.assets, this.onSucess, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumProvider);
    final albumNotifier = ref.watch(albumProvider.notifier);
    final albumService = ref.watch(albumServiceProvider);

    useEffect(() {
      if (albums.isEmpty) {
        albumNotifier.getAllAlbums();
      }
    });

    void createNewAlbum() async {
      final album = await albumNotifier.createAlbum(
          "add_to_album_dialog_default_title".tr(), assets);

      if (album != null) {
        onSucess(album.albumName);
      }
    }

    void addToAlbum(AlbumResponseDto album) async {
      final result =
          await albumService.addAdditionalAssetToAlbum(assets, album.id);

      if (result) {
        onSucess(album.albumName);
      }
    }

    Widget renderAlbum(AlbumResponseDto album) {
      return AlbumListAlbumEntry(album, onClick: () => addToAlbum(album));
    }

    List<Widget> renderAlbums() {
      List<Widget> list = albums.map((e) => renderAlbum(e)).toList();
      list.insert(0, AlbumListAddEntry(onClick: createNewAlbum));
      return list;
    }

    return AlertDialog(
        title: Text(
          "add_to_album_dialog_title",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).primaryColor,
          ),
        ).tr(),
        content: SizedBox(
          height: 300,
          child: SingleChildScrollView(
            child: Column(
              children: renderAlbums(),
            ),
          ),
        ));
  }
}

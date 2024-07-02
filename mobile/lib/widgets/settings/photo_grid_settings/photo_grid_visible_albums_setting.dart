import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:photo_manager/photo_manager.dart';

class VisibleAlbumsSettings extends HookConsumerWidget {
  const VisibleAlbumsSettings({
    super.key,
  });

  getAlbumOnDevice() async {
    final albums = await PhotoManager.getAssetPathList(
      hasAll: true,
    );

    debugPrint("Albums: $albums");
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    useEffect(
      () {
        getAlbumOnDevice();
        return null;
      },
      [ref.watch(galleryPermissionNotifier)],
    );

    return ListTile(
      title: const Text('Visible albums'),
      subtitle:
          const Text('Select which local albums will be shown on the timeline'),
      onTap: () => context.pushRoute(const LocalAlbumPickerRoute()),
    );
  }
}

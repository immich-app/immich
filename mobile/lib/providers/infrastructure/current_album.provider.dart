import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

final currentRemoteAlbumProvider =
    AutoDisposeNotifierProvider<CurrentAlbumNotifier, RemoteAlbum?>(
  CurrentAlbumNotifier.new,
);

class CurrentAlbumNotifier extends AutoDisposeNotifier<RemoteAlbum?> {
  KeepAliveLink? _keepAliveLink;
  StreamSubscription<RemoteAlbum?>? _assetSubscription;

  @override
  RemoteAlbum? build() => null;

  void setAlbum(RemoteAlbum album) {
    _keepAliveLink?.close();
    _assetSubscription?.cancel();
    state = album;

    _assetSubscription = ref
        .watch(remoteAlbumServiceProvider)
        .watchAlbum(album.id)
        .listen((updatedAlbum) {
      if (updatedAlbum != null) {
        state = updatedAlbum;
      }
    });
    _keepAliveLink = ref.keepAlive();
  }

  void dispose() {
    _keepAliveLink?.close();
    _assetSubscription?.cancel();
  }
}

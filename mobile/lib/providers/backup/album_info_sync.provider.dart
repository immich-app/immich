import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

final albumInfoSyncProvider = NotifierProvider<AlbumInfoSyncNotifier, bool>(AlbumInfoSyncNotifier.new);

class AlbumInfoSyncNotifier extends Notifier<bool> {
  late LocalAlbumService _localAlbumService;
  late RemoteAlbumService _remoteAlbumService;

  @override
  bool build() {
    _localAlbumService = ref.read(localAlbumServiceProvider);
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return true;
  }

  Future<void> manageLinkedAlbums(List<LocalAlbum> localAlbums, String ownerId) async {
    for (final localAlbum in localAlbums) {
      debugPrint("Creating mirror albums for ${localAlbum.name}");
      final remoteAlbum = await _remoteAlbumService.getByName(localAlbum.name, ownerId);
      if (remoteAlbum != null) {
        debugPrint("Remote album ${localAlbum.name} already exists, skipping creation");
        continue;
      }
      debugPrint("Creating remote album for ${localAlbum.name}");
      await _remoteAlbumService.createAlbum(title: localAlbum.name, assetIds: []);
    }
  }
}

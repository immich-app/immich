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

  Future<void> createMirrorAlbums(List<LocalAlbum> localAlbums, String ownerId) async {
    for (final localAlbum in localAlbums) {
      final remoteAlbum = await _remoteAlbumService.getByName(localAlbum.name, ownerId);
      if (remoteAlbum != null) {
        continue;
      }

      _remoteAlbumService.createAlbum(title: localAlbum.name, assetIds: []);
    }
  }
}

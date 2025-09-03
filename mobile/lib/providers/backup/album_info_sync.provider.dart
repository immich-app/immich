import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';

final syncLinkedAlbumProvider = NotifierProvider<SyncLinkedAlbumNotifier, bool>(SyncLinkedAlbumNotifier.new);

class SyncLinkedAlbumNotifier extends Notifier<bool> {
  late LocalAlbumService _localAlbumService;
  late RemoteAlbumService _remoteAlbumService;

  @override
  bool build() {
    _localAlbumService = ref.read(localAlbumServiceProvider);
    _remoteAlbumService = ref.read(remoteAlbumServiceProvider);
    return true;
  }

  Future<void> syncLinkedAlbums() async {
    final user = ref.read(currentUserProvider);
    if (user == null) {
      return Future.value(null);
    }

    final selectedAlbums = await _localAlbumService.getBackupAlbums();

    return _remoteAlbumService.syncLinkedAlbums(user.id, selectedAlbums);
  }

  Future<void> manageLinkedAlbums(List<LocalAlbum> localAlbums, String ownerId) {
    return Future.wait(localAlbums.map((album) => _processLocalAlbum(album, ownerId)));
  }

  /// Processes a single local album to ensure proper linking with remote albums
  Future<void> _processLocalAlbum(LocalAlbum localAlbum, String ownerId) {
    final hasLinkedRemoteAlbum = localAlbum.linkedRemoteAlbumId != null;

    if (hasLinkedRemoteAlbum) {
      return _handleLinkedAlbum(localAlbum);
    } else {
      return _handleUnlinkedAlbum(localAlbum, ownerId);
    }
  }

  /// Handles albums that are already linked to a remote album
  Future<void> _handleLinkedAlbum(LocalAlbum localAlbum) async {
    final remoteAlbumId = localAlbum.linkedRemoteAlbumId!;
    final remoteAlbum = await _remoteAlbumService.get(remoteAlbumId);

    final remoteAlbumExists = remoteAlbum != null;
    if (!remoteAlbumExists) {
      return _localAlbumService.unlinkRemoteAlbum(localAlbum.id);
    }
  }

  /// Handles albums that are not linked to any remote album
  Future<void> _handleUnlinkedAlbum(LocalAlbum localAlbum, String ownerId) async {
    final existingRemoteAlbum = await _remoteAlbumService.getByName(localAlbum.name, ownerId);

    if (existingRemoteAlbum != null) {
      return _linkToExistingRemoteAlbum(localAlbum, existingRemoteAlbum);
    } else {
      return _createAndLinkNewRemoteAlbum(localAlbum);
    }
  }

  /// Links a local album to an existing remote album
  Future<void> _linkToExistingRemoteAlbum(LocalAlbum localAlbum, dynamic existingRemoteAlbum) {
    return _localAlbumService.linkRemoteAlbum(localAlbum.id, existingRemoteAlbum.id);
  }

  /// Creates a new remote album and links it to the local album
  Future<void> _createAndLinkNewRemoteAlbum(LocalAlbum localAlbum) async {
    final newRemoteAlbum = await _remoteAlbumService.createAlbum(title: localAlbum.name, assetIds: []);
    return _localAlbumService.linkRemoteAlbum(localAlbum.id, newRemoteAlbum.id);
  }
}

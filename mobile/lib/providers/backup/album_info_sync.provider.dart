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
      await _processLocalAlbum(localAlbum, ownerId);
    }
  }

  /// Processes a single local album to ensure proper linking with remote albums
  Future<void> _processLocalAlbum(LocalAlbum localAlbum, String ownerId) async {
    final hasLinkedRemoteAlbum = localAlbum.linkedRemoteAlbumId != null;

    if (hasLinkedRemoteAlbum) {
      await _handleLinkedAlbum(localAlbum);
    } else {
      await _handleUnlinkedAlbum(localAlbum, ownerId);
    }
  }

  /// Handles albums that are already linked to a remote album
  Future<void> _handleLinkedAlbum(LocalAlbum localAlbum) async {
    final remoteAlbumId = localAlbum.linkedRemoteAlbumId!;
    final remoteAlbum = await _remoteAlbumService.get(remoteAlbumId);

    final remoteAlbumExists = remoteAlbum != null;
    if (!remoteAlbumExists) {
      await _localAlbumService.unlinkRemoteAlbum(localAlbum.id);
    }
  }

  /// Handles albums that are not linked to any remote album
  Future<void> _handleUnlinkedAlbum(LocalAlbum localAlbum, String ownerId) async {
    final existingRemoteAlbum = await _remoteAlbumService.getByName(localAlbum.name, ownerId);

    if (existingRemoteAlbum != null) {
      await _linkToExistingRemoteAlbum(localAlbum, existingRemoteAlbum);
    } else {
      await _createAndLinkNewRemoteAlbum(localAlbum);
    }
  }

  /// Links a local album to an existing remote album
  Future<void> _linkToExistingRemoteAlbum(LocalAlbum localAlbum, dynamic existingRemoteAlbum) {
    return _localAlbumService.linkRemoteAlbum(localAlbum.id, existingRemoteAlbum.id);
  }

  /// Creates a new remote album and links it to the local album
  Future<void> _createAndLinkNewRemoteAlbum(LocalAlbum localAlbum) async {
    final newRemoteAlbum = await _remoteAlbumService.createAlbum(title: localAlbum.name, assetIds: []);
    await _localAlbumService.linkRemoteAlbum(localAlbum.id, newRemoteAlbum.id);
  }
}

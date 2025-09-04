import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';

final syncLinkedAlbumServiceProvider = Provider(
  (ref) => SyncLinkedAlbumService(
    ref.watch(localAlbumRepository),
    ref.watch(remoteAlbumRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
  ),
);

class SyncLinkedAlbumService {
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final DriftAlbumApiRepository _albumApiRepository;

  const SyncLinkedAlbumService(this._localAlbumRepository, this._remoteAlbumRepository, this._albumApiRepository);

  Future<void> syncLinkedAlbums(String userId) async {
    final selectedAlbums = await _localAlbumRepository.getBackupAlbums();

    await Future.wait(
      selectedAlbums.map((localAlbum) async {
        final linkedRemoteAlbumId = localAlbum.linkedRemoteAlbumId;
        if (linkedRemoteAlbumId == null) {
          return;
        }

        final remoteAlbum = await _remoteAlbumRepository.get(linkedRemoteAlbumId);
        if (remoteAlbum == null) {
          return;
        }

        // get assets that are uploaded but not in the remote album
        final assetIds = await _remoteAlbumRepository.getLinkedAssetIds(userId, localAlbum.id, linkedRemoteAlbumId);

        if (assetIds.isNotEmpty) {
          final album = await _albumApiRepository.addAssets(remoteAlbum.id, assetIds);
          await _remoteAlbumRepository.addAssets(remoteAlbum.id, album.added);
        }
      }),
    );
  }

  Future<void> manageLinkedAlbums(List<LocalAlbum> localAlbums, String ownerId) async {
    for (final album in localAlbums) {
      await _processLocalAlbum(album, ownerId);
    }
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
    final remoteAlbum = await _remoteAlbumRepository.get(remoteAlbumId);

    final remoteAlbumExists = remoteAlbum != null;
    if (!remoteAlbumExists) {
      return _localAlbumRepository.unlinkRemoteAlbum(localAlbum.id);
    }
  }

  /// Handles albums that are not linked to any remote album
  Future<void> _handleUnlinkedAlbum(LocalAlbum localAlbum, String ownerId) async {
    final existingRemoteAlbum = await _remoteAlbumRepository.getByName(localAlbum.name, ownerId);

    if (existingRemoteAlbum != null) {
      return _linkToExistingRemoteAlbum(localAlbum, existingRemoteAlbum);
    } else {
      return _createAndLinkNewRemoteAlbum(localAlbum);
    }
  }

  /// Links a local album to an existing remote album
  Future<void> _linkToExistingRemoteAlbum(LocalAlbum localAlbum, dynamic existingRemoteAlbum) {
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, existingRemoteAlbum.id);
  }

  /// Creates a new remote album and links it to the local album
  Future<void> _createAndLinkNewRemoteAlbum(LocalAlbum localAlbum) async {
    debugPrint("Creating new remote album for local album: ${localAlbum.name}");
    final newRemoteAlbum = await _albumApiRepository.createDriftAlbum(localAlbum.name, assetIds: []);
    await _remoteAlbumRepository.create(newRemoteAlbum, []);
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, newRemoteAlbum.id);
  }
}

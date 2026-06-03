import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

final syncLinkedAlbumServiceProvider = Provider(
  (ref) => SyncLinkedAlbumService(
    ref.watch(localAlbumRepository),
    ref.watch(remoteAlbumRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(storeServiceProvider),
  ),
);

class SyncLinkedAlbumService {
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final DriftAlbumApiRepository _albumApiRepository;
  final StoreService _storeService;

  SyncLinkedAlbumService(
    this._localAlbumRepository,
    this._remoteAlbumRepository,
    this._albumApiRepository,
    this._storeService,
  );

  final _log = Logger("SyncLinkedAlbumService");

  Future<void> syncLinkedAlbums(String userId) async {
    final selectedAlbums = await _localAlbumRepository.getBackupAlbums();

    await Future.wait(
      selectedAlbums.map((localAlbum) async {
        try {
          final linkedRemoteAlbumId = localAlbum.linkedRemoteAlbumId;
          if (linkedRemoteAlbumId == null) {
            _log.warning("No linked remote album ID found for local album: ${localAlbum.name}");
            return;
          }

          final remoteAlbum = await _remoteAlbumRepository.get(linkedRemoteAlbumId);
          if (remoteAlbum == null) {
            _log.warning("Linked remote album not found for ID: $linkedRemoteAlbumId");
            return;
          }

          // get assets that are uploaded but not in the remote album
          final assetIds = await _remoteAlbumRepository.getLinkedAssetIds(userId, localAlbum.id, linkedRemoteAlbumId);
          _log.fine("Syncing ${assetIds.length} assets to remote album: ${remoteAlbum.name}");
          if (assetIds.isNotEmpty) {
            final album = await _albumApiRepository.addAssets(remoteAlbum.id, assetIds);
            await _remoteAlbumRepository.addAssets(remoteAlbum.id, album.added);
          }
        } on RemoteAlbumNotFoundException catch (e) {
          // server doesn't have the linked album anymore. drop the cached row;
          // KeyAction.setNull on LocalAlbumEntity.linkedRemoteAlbumId nulls
          // the link via FK cascade, and the next manageLinkedAlbums run
          // will recreate or re-link by name.
          _log.warning(
            "Pruning stale linked album for ${localAlbum.name} (server returned 'Album not found' for ${e.albumId})",
          );
          await _remoteAlbumRepository.deleteAlbum(e.albumId);
        } catch (error, stack) {
          _log.severe("Linked album sync failed for ${localAlbum.name}", error, stack);
        }
      }),
    );
  }

  Future<void> manageLinkedAlbums(List<LocalAlbum> localAlbums, String ownerId) async {
    // fetch the server's authoritative owned-album list once and reconcile each
    // local album against it. trusting only the local cache (previous behaviour)
    // misses the case where the server lost an album that mobile still has
    // cached (volume reset, soft-deleted user, etc).
    final List<RemoteAlbum> serverAlbums;
    try {
      serverAlbums = await _albumApiRepository.getAllOwned(_storeService.get(StoreKey.currentUser));
    } catch (error, stackTrace) {
      // soft-fail on network / server error so a flaky link doesn't destroy local state
      _log.severe("Could not fetch server albums; deferring manageLinkedAlbums", error, stackTrace);
      return;
    }

    final serverById = {for (final a in serverAlbums) a.id: a};
    final serverByName = {for (final a in serverAlbums) a.name: a};

    try {
      for (final album in localAlbums) {
        await _processLocalAlbum(album, serverById, serverByName);
      }
    } catch (error, stackTrace) {
      _log.severe("Error managing linked albums", error, stackTrace);
    }
  }

  /// Reconciles a single local album against the server's owned-album list.
  Future<void> _processLocalAlbum(
    LocalAlbum localAlbum,
    Map<String, RemoteAlbum> serverById,
    Map<String, RemoteAlbum> serverByName,
  ) async {
    final linkedId = localAlbum.linkedRemoteAlbumId;
    if (linkedId != null && serverById.containsKey(linkedId)) {
      return;
    }
    if (linkedId != null) {
      // server doesn't have this album anymore. drop the cached row; KeyAction.setNull
      // on LocalAlbumEntity.linkedRemoteAlbumId nulls the link via FK cascade.
      await _remoteAlbumRepository.deleteAlbum(linkedId);
    }

    final byNameMatch = serverByName[localAlbum.name];
    if (byNameMatch != null) {
      await _linkToExistingRemoteAlbum(localAlbum, byNameMatch);
    } else {
      await _createAndLinkNewRemoteAlbum(localAlbum);
    }
  }

  /// Links a local album to an existing remote album, ensuring the cache row exists
  /// so subsequent [syncLinkedAlbums] passes can find it without waiting for sync stream.
  Future<void> _linkToExistingRemoteAlbum(LocalAlbum localAlbum, RemoteAlbum existingRemoteAlbum) async {
    final cached = await _remoteAlbumRepository.get(existingRemoteAlbum.id);
    if (cached == null) {
      await _remoteAlbumRepository.create(existingRemoteAlbum, []);
    }
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, existingRemoteAlbum.id);
  }

  /// Creates a new remote album and links it to the local album
  Future<void> _createAndLinkNewRemoteAlbum(LocalAlbum localAlbum) async {
    dPrint(() => "Creating new remote album for local album: ${localAlbum.name}");
    final newRemoteAlbum = await _albumApiRepository.createDriftAlbum(
      localAlbum.name,
      _storeService.get(StoreKey.currentUser),
      assetIds: [],
    );
    await _remoteAlbumRepository.create(newRemoteAlbum, []);
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, newRemoteAlbum.id);
  }
}

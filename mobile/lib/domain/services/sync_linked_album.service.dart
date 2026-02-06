import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/remote_album.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_exclusion.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

final syncLinkedAlbumServiceProvider = Provider(
  (ref) => SyncLinkedAlbumService(
    ref.watch(localAlbumRepository),
    ref.watch(remoteAlbumRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(remoteAlbumServiceProvider),
    ref.watch(syncExclusionRepositoryProvider),
  ),
);

class SyncLinkedAlbumService {
  final DriftLocalAlbumRepository _localAlbumRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final DriftAlbumApiRepository _albumApiRepository;
  final RemoteAlbumService _remoteAlbumService;
  final SyncExclusionRepository _syncExclusionRepository;

  SyncLinkedAlbumService(
    this._localAlbumRepository,
    this._remoteAlbumRepository,
    this._albumApiRepository,
    this._remoteAlbumService,
    this._syncExclusionRepository,
  );

  final _log = Logger("SyncLinkedAlbumService");

  Future<void> syncLinkedAlbums(String userId) async {
    print("DEBUG syncLinkedAlbums: Starting for userId=$userId");
    final selectedAlbums = await _localAlbumRepository.getBackupAlbums();
    print("DEBUG syncLinkedAlbums: Found ${selectedAlbums.length} backup albums");
    final enableSyncExclusions = Store.get(AppSettingsEnum.enableSyncExclusions.storeKey, true);

    await Future.wait(
      selectedAlbums.map((localAlbum) async {
        print("DEBUG syncLinkedAlbums: Processing local album '${localAlbum.name}' (id=${localAlbum.id})");
        final linkedRemoteAlbumId = localAlbum.linkedRemoteAlbumId;
        if (linkedRemoteAlbumId == null) {
          print("DEBUG syncLinkedAlbums: WARNING - No linkedRemoteAlbumId for '${localAlbum.name}'");
          _log.warning("No linked remote album ID found for local album: ${localAlbum.name}");
          return;
        }
        print("DEBUG syncLinkedAlbums: linkedRemoteAlbumId=$linkedRemoteAlbumId");

        final remoteAlbum = await _remoteAlbumRepository.get(linkedRemoteAlbumId);
        if (remoteAlbum == null) {
          print("DEBUG syncLinkedAlbums: WARNING - Remote album not found for ID $linkedRemoteAlbumId");
          _log.warning("Linked remote album not found for ID: $linkedRemoteAlbumId");
          return;
        }
        print("DEBUG syncLinkedAlbums: Found remote album '${remoteAlbum.name}'");

        // get assets that are uploaded but not in the remote album
        var assetIds = await _remoteAlbumRepository.getLinkedAssetIds(userId, localAlbum.id, linkedRemoteAlbumId);
        print("DEBUG syncLinkedAlbums: getLinkedAssetIds returned ${assetIds.length} assets");

        // Filter out excluded assets if sync exclusions are enabled
        if (enableSyncExclusions && assetIds.isNotEmpty) {
          final excludedIds = await _syncExclusionRepository.getExcludedAssetIds(localAlbum.id);
          if (excludedIds.isNotEmpty) {
            final originalCount = assetIds.length;
            assetIds = assetIds.where((id) => !excludedIds.contains(id)).toList();
            print("DEBUG syncLinkedAlbums: Filtered ${originalCount - assetIds.length} excluded assets");
            _log.fine("Filtered ${originalCount - assetIds.length} excluded assets from sync");
          }
        }

        _log.fine("Syncing ${assetIds.length} assets to remote album: ${remoteAlbum.name}");
        if (assetIds.isNotEmpty) {
          print("DEBUG syncLinkedAlbums: Adding ${assetIds.length} assets to remote album '${remoteAlbum.name}'");
          // Use RemoteAlbumService.addAssets which auto-updates the album cover
          await _remoteAlbumService.addAssets(albumId: remoteAlbum.id, assetIds: assetIds);
          print("DEBUG syncLinkedAlbums: Successfully added assets to remote album");
        } else {
          print("DEBUG syncLinkedAlbums: No assets to add to '${remoteAlbum.name}'");
        }
      }),
    );
    print("DEBUG syncLinkedAlbums: Completed");
  }

  Future<void> manageLinkedAlbums(List<LocalAlbum> localAlbums, String ownerId) async {
    print("DEBUG manageLinkedAlbums: Starting with ${localAlbums.length} albums for owner $ownerId");
    try {
      for (final album in localAlbums) {
        print("DEBUG manageLinkedAlbums: Processing album '${album.name}'");
        await _processLocalAlbum(album, ownerId);
      }
    } catch (error, stackTrace) {
      print("DEBUG manageLinkedAlbums: ERROR - $error");
      _log.severe("Error managing linked albums", error, stackTrace);
    }
    print("DEBUG manageLinkedAlbums: Completed");
  }

  /// Processes a single local album to ensure proper linking with remote albums
  Future<void> _processLocalAlbum(LocalAlbum localAlbum, String ownerId) {
    final hasLinkedRemoteAlbum = localAlbum.linkedRemoteAlbumId != null;
    print("DEBUG _processLocalAlbum: '${localAlbum.name}' hasLinkedRemoteAlbum=$hasLinkedRemoteAlbum");

    if (hasLinkedRemoteAlbum) {
      return _handleLinkedAlbum(localAlbum);
    } else {
      return _handleUnlinkedAlbum(localAlbum, ownerId);
    }
  }

  /// Handles albums that are already linked to a remote album
  Future<void> _handleLinkedAlbum(LocalAlbum localAlbum) async {
    print("DEBUG _handleLinkedAlbum: '${localAlbum.name}' checking remote album ${localAlbum.linkedRemoteAlbumId}");
    final remoteAlbumId = localAlbum.linkedRemoteAlbumId!;
    final remoteAlbum = await _remoteAlbumRepository.get(remoteAlbumId);

    final remoteAlbumExists = remoteAlbum != null;
    if (!remoteAlbumExists) {
      print("DEBUG _handleLinkedAlbum: Remote album not found, unlinking");
      return _localAlbumRepository.unlinkRemoteAlbum(localAlbum.id);
    }
    print("DEBUG _handleLinkedAlbum: Remote album exists, link is valid");
  }

  /// Handles albums that are not linked to any remote album
  Future<void> _handleUnlinkedAlbum(LocalAlbum localAlbum, String ownerId) async {
    print("DEBUG _handleUnlinkedAlbum: '${localAlbum.name}' searching for remote album by name");
    final existingRemoteAlbum = await _remoteAlbumRepository.getByName(localAlbum.name, ownerId);
    print(
      "DEBUG _handleUnlinkedAlbum: Found existing remote album: ${existingRemoteAlbum != null ? existingRemoteAlbum.name : 'NULL'}",
    );

    if (existingRemoteAlbum != null) {
      return _linkToExistingRemoteAlbum(localAlbum, existingRemoteAlbum);
    } else {
      return _createAndLinkNewRemoteAlbum(localAlbum);
    }
  }

  /// Links a local album to an existing remote album
  Future<void> _linkToExistingRemoteAlbum(LocalAlbum localAlbum, dynamic existingRemoteAlbum) {
    print("DEBUG _linkToExistingRemoteAlbum: Linking '${localAlbum.name}' to remote album ${existingRemoteAlbum.id}");
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, existingRemoteAlbum.id);
  }

  /// Creates a new remote album and links it to the local album
  Future<void> _createAndLinkNewRemoteAlbum(LocalAlbum localAlbum) async {
    print("DEBUG _createAndLinkNewRemoteAlbum: Creating new remote album for '${localAlbum.name}'");
    dPrint(() => "Creating new remote album for local album: ${localAlbum.name}");
    final newRemoteAlbum = await _albumApiRepository.createDriftAlbum(localAlbum.name, assetIds: []);
    print("DEBUG _createAndLinkNewRemoteAlbum: Created remote album with ID ${newRemoteAlbum.id}");
    await _remoteAlbumRepository.create(newRemoteAlbum, []);
    print("DEBUG _createAndLinkNewRemoteAlbum: Saved to local DB, now linking");
    return _localAlbumRepository.linkRemoteAlbum(localAlbum.id, newRemoteAlbum.id);
  }
}

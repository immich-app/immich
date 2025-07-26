import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart' as maplibre;
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(remoteAlbumRepository),
    ref.watch(assetMediaRepositoryProvider),
    ref.watch(downloadRepositoryProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftAlbumApiRepository _albumApiRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final AssetMediaRepository _assetMediaRepository;
  final DownloadRepository _downloadRepository;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._localAssetRepository,
    this._albumApiRepository,
    this._remoteAlbumRepository,
    this._assetMediaRepository,
    this._downloadRepository,
  );

  Future<void> shareLink(List<String> remoteIds, BuildContext context) async {
    context.pushRoute(
      SharedLinkEditRoute(
        assetsList: remoteIds,
      ),
    );
  }

  Future<void> favorite(List<String> remoteIds) async {
    await _assetApiRepository.updateFavorite(remoteIds, true);
    await _remoteAssetRepository.updateFavorite(remoteIds, true);
  }

  Future<void> unFavorite(List<String> remoteIds) async {
    await _assetApiRepository.updateFavorite(remoteIds, false);
    await _remoteAssetRepository.updateFavorite(remoteIds, false);
  }

  Future<void> archive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.archive,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.archive,
    );
  }

  Future<void> unArchive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.timeline,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.timeline,
    );
  }

  Future<void> moveToLockFolder(
    List<String> remoteIds,
    List<String> localIds,
  ) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.locked,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.locked,
    );

    // Ask user if they want to delete local copies
    if (localIds.isNotEmpty) {
      final deletedIds = await _assetMediaRepository.deleteAll(localIds);

      if (deletedIds.isNotEmpty) {
        await _localAssetRepository.delete(deletedIds);
      }
    }
  }

  Future<void> removeFromLockFolder(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(
      remoteIds,
      AssetVisibilityEnum.timeline,
    );
    await _remoteAssetRepository.updateVisibility(
      remoteIds,
      AssetVisibility.timeline,
    );
  }

  Future<void> trash(List<String> remoteIds) async {
    await _assetApiRepository.delete(remoteIds, false);
    await _remoteAssetRepository.trash(remoteIds);
  }

  Future<void> restoreTrash(List<String> ids) async {
    await _assetApiRepository.restoreTrash(ids);
    await _remoteAssetRepository.restoreTrash(ids);
  }

  Future<void> trashRemoteAndDeleteLocal(List<String> remoteIds, List<String> localIds) async {
    await _assetApiRepository.delete(remoteIds, false);
    await _remoteAssetRepository.trash(remoteIds);

    if (localIds.isNotEmpty) {
      final deletedIds = await _assetMediaRepository.deleteAll(localIds);

      if (deletedIds.isNotEmpty) {
        await _localAssetRepository.delete(deletedIds);
      }
    }
  }

  Future<void> deleteRemoteAndLocal(
    List<String> remoteIds,
    List<String> localIds,
  ) async {
    await _assetApiRepository.delete(remoteIds, true);
    await _remoteAssetRepository.delete(remoteIds);

    if (localIds.isNotEmpty) {
      final deletedIds = await _assetMediaRepository.deleteAll(localIds);

      if (deletedIds.isNotEmpty) {
        await _localAssetRepository.delete(deletedIds);
      }
    }
  }

  Future<int> deleteLocal(List<String> localIds) async {
    final deletedIds = await _assetMediaRepository.deleteAll(localIds);
    if (deletedIds.isNotEmpty) {
      await _localAssetRepository.delete(deletedIds);
      return deletedIds.length;
    }

    return 0;
  }

  Future<bool> editLocation(
    List<String> remoteIds,
    BuildContext context,
  ) async {
    maplibre.LatLng? initialLatLng;
    if (remoteIds.length == 1) {
      final exif = await _remoteAssetRepository.getExif(remoteIds[0]);

      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = maplibre.LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    final location = await showLocationPicker(
      context: context,
      initialLatLng: initialLatLng,
    );

    if (location == null) {
      return false;
    }

    await _assetApiRepository.updateLocation(
      remoteIds,
      location,
    );
    await _remoteAssetRepository.updateLocation(
      remoteIds,
      location,
    );

    return true;
  }

  Future<int> removeFromAlbum(List<String> remoteIds, String albumId) async {
    int removedCount = 0;
    final result = await _albumApiRepository.removeAssets(albumId, remoteIds);

    if (result.removed.isNotEmpty) {
      removedCount = await _remoteAlbumRepository.removeAssets(albumId, result.removed);
    }

    return removedCount;
  }

  Future<void> stack(String userId, List<String> remoteIds) async {
    final stack = await _assetApiRepository.stack(remoteIds);
    await _remoteAssetRepository.stack(userId, stack);
  }

  Future<void> unStack(List<String> stackIds) async {
    await _remoteAssetRepository.unStack(stackIds);
    await _assetApiRepository.unStack(stackIds);
  }

  Future<int> shareAssets(List<BaseAsset> assets) {
    return _assetMediaRepository.shareAssets(assets);
  }

  Future<List<bool>> downloadAll(List<RemoteAsset> assets) {
    return _downloadRepository.downloadAllAssets(assets);
  }
}

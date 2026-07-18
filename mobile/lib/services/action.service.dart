import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/trashed_local_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(remoteAlbumRepository),
    ref.watch(trashedLocalAssetRepository),
    ref.watch(assetMediaRepositoryProvider),
    ref.watch(downloadRepositoryProvider),
    ref.watch(tagServiceProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftLocalAssetRepository _localAssetRepository;
  final DriftAlbumApiRepository _albumApiRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final DriftTrashedLocalAssetRepository _trashedLocalAssetRepository;
  final AssetMediaRepository _assetMediaRepository;
  final DownloadRepository _downloadRepository;
  final TagService _tagService;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._localAssetRepository,
    this._albumApiRepository,
    this._remoteAlbumRepository,
    this._trashedLocalAssetRepository,
    this._assetMediaRepository,
    this._downloadRepository,
    this._tagService,
  );

  Future<void> moveToLockFolder(List<String> remoteIds, List<String> localIds) async {
    await _assetApiRepository.updateVisibility(remoteIds, .locked);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked);

    // Ask user if they want to delete local copies
    if (localIds.isNotEmpty) {
      await _deleteLocalAssets(localIds);
    }
  }

  Future<void> removeFromLockFolder(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(remoteIds, .timeline);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.timeline);
  }

  Future<int> emptyTrash(String userId) async {
    final count = await _assetApiRepository.emptyTrash();
    await _remoteAssetRepository.emptyTrash(userId);
    return count;
  }

  Future<int> restoreAllTrash(String userId) async {
    final count = await _assetApiRepository.restoreAllTrash();
    await _remoteAssetRepository.restoreAllTrash(userId);
    return count;
  }

  Future<void> trashRemoteAndDeleteLocal(List<String> remoteIds, List<String> localIds) async {
    await _assetApiRepository.delete(remoteIds, false);
    await _remoteAssetRepository.trash(remoteIds);

    if (localIds.isNotEmpty) {
      await _deleteLocalAssets(localIds);
    }
  }

  Future<void> deleteRemoteAndLocal(List<String> remoteIds, List<String> localIds) async {
    await _assetApiRepository.delete(remoteIds, true);
    await _remoteAssetRepository.delete(remoteIds);

    if (localIds.isNotEmpty) {
      await _deleteLocalAssets(localIds);
    }
  }

  Future<int> deleteLocal(List<String> localIds) async {
    return await _deleteLocalAssets(localIds);
  }

  Future<bool> updateDescription(String assetId, String description) async {
    // update remote first, then local to ensure consistency
    await _assetApiRepository.updateDescription(assetId, description);
    await _remoteAssetRepository.updateDescription(assetId, description);

    return true;
  }

  Future<bool> updateRating(String assetId, int? rating) async {
    // update remote first, then local to ensure consistency
    await _assetApiRepository.updateRating(assetId, rating);
    await _remoteAssetRepository.updateRating(assetId, rating);

    return true;
  }

  Future<int?> tagAssets(List<String> remoteIds, BuildContext context) async {
    final tagResults = await showTagPickerModal(context: context);
    if (tagResults == null) {
      // user cancelled
      return null;
    }

    final selectedTagIds = Set<String>.from(tagResults.$1);
    final selectedNewTagValues = tagResults.$2;

    if (selectedNewTagValues.isNotEmpty) {
      final upsertedTags = await _tagService.upsertTags(selectedNewTagValues.toList());
      selectedTagIds.addAll(upsertedTags.map((t) => t.id));
    }
    if (selectedTagIds.isEmpty) {
      return 0;
    }
    return _tagService.bulkTagAssets(remoteIds, selectedTagIds.toList());
  }

  Future<void> stack(String userId, List<String> remoteIds) async {
    final stack = await _assetApiRepository.stack(remoteIds);
    await _remoteAssetRepository.stack(userId, stack);
  }

  Future<void> unStack(List<String> stackIds) async {
    await _remoteAssetRepository.unStack(stackIds);
    await _assetApiRepository.unStack(stackIds);
  }

  Future<List<bool>> downloadAll(List<RemoteAsset> assets) {
    return _downloadRepository.downloadAllAssets(assets);
  }

  Future<bool> setAlbumCover(String albumId, String assetId) async {
    final owner = await _remoteAlbumRepository.getOwner(albumId);
    final updatedAlbum = await _albumApiRepository.updateAlbum(albumId, owner, thumbnailAssetId: assetId);
    await _remoteAlbumRepository.update(updatedAlbum);
    return true;
  }

  Future<int> _deleteLocalAssets(List<String> localIds) async {
    final deletedIds = await _assetMediaRepository.deleteAll(localIds);
    if (deletedIds.isEmpty) {
      return 0;
    }
    if (CurrentPlatform.isAndroid && Store.get(StoreKey.manageLocalMediaAndroid, false)) {
      await _trashedLocalAssetRepository.applyTrashedAssets(deletedIds);
    } else {
      await _localAssetRepository.delete(deletedIds);
    }
    return deletedIds.length;
  }
}

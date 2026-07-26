import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(remoteAlbumRepository),
    ref.watch(downloadRepositoryProvider),
    ref.watch(tagServiceProvider),
  ),
);

class ActionService {
  final AssetApiRepository _assetApiRepository;
  final RemoteAssetRepository _remoteAssetRepository;
  final DriftAlbumApiRepository _albumApiRepository;
  final DriftRemoteAlbumRepository _remoteAlbumRepository;
  final DownloadRepository _downloadRepository;
  final TagService _tagService;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._albumApiRepository,
    this._remoteAlbumRepository,
    this._downloadRepository,
    this._tagService,
  );

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

  Future<int> removeFromAlbum(List<String> remoteIds, String albumId) async {
    final result = await _albumApiRepository.removeAssets(albumId, remoteIds);
    if (result.removed.isNotEmpty) {
      await _remoteAlbumRepository.removeAssets(albumId, result.removed);
    }
    return result.removed.length;
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

  Future<List<bool>> downloadAll(List<RemoteAsset> assets) {
    return _downloadRepository.downloadAllAssets(assets);
  }

  Future<bool> setAlbumCover(String albumId, String assetId) async {
    final owner = await _remoteAlbumRepository.getOwner(albumId);
    final updatedAlbum = await _albumApiRepository.updateAlbum(albumId, owner, thumbnailAssetId: assetId);
    await _remoteAlbumRepository.update(updatedAlbum);
    return true;
  }
}

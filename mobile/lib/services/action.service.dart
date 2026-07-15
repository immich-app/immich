import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_album.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_mobile/repositories/drift_album_api_repository.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:immich_mobile/widgets/common/tag_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart' as maplibre;

final actionServiceProvider = Provider<ActionService>(
  (ref) => ActionService(
    ref.watch(assetApiRepositoryProvider),
    ref.watch(remoteAssetRepositoryProvider),
    ref.watch(localAssetRepository),
    ref.watch(driftAlbumApiRepositoryProvider),
    ref.watch(remoteAlbumRepository),
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
  final AssetMediaRepository _assetMediaRepository;
  final DownloadRepository _downloadRepository;
  final TagService _tagService;

  const ActionService(
    this._assetApiRepository,
    this._remoteAssetRepository,
    this._localAssetRepository,
    this._albumApiRepository,
    this._remoteAlbumRepository,
    this._assetMediaRepository,
    this._downloadRepository,
    this._tagService,
  );

  Future<void> shareLink(List<String> remoteIds, BuildContext context) async {
    unawaited(context.pushRoute(SharedLinkEditRoute(assetsList: remoteIds)));
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
    await _assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.archive);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.archive);
  }

  Future<void> unArchive(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.timeline);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.timeline);
  }

  Future<void> moveToLockFolder(List<String> remoteIds, List<String> localIds) async {
    await _assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.locked);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.locked);

    // Ask user if they want to delete local copies
    if (localIds.isNotEmpty) {
      await _deleteLocalAssets(localIds);
    }
  }

  Future<void> removeFromLockFolder(List<String> remoteIds) async {
    await _assetApiRepository.updateVisibility(remoteIds, AssetVisibilityEnum.timeline);
    await _remoteAssetRepository.updateVisibility(remoteIds, AssetVisibility.timeline);
  }

  Future<void> trash(List<String> remoteIds) async {
    await _assetApiRepository.delete(remoteIds, false);
    await _remoteAssetRepository.trash(remoteIds);
  }

  Future<void> restoreTrash(List<String> ids) async {
    await _assetApiRepository.restoreTrash(ids);
    await _remoteAssetRepository.restoreTrash(ids);
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

  Future<bool> editLocation(List<String> remoteIds, BuildContext context) async {
    maplibre.LatLng? initialLatLng;
    if (remoteIds.length == 1) {
      final exif = await _remoteAssetRepository.getExif(remoteIds[0]);

      if (exif?.latitude != null && exif?.longitude != null) {
        initialLatLng = maplibre.LatLng(exif!.latitude!, exif.longitude!);
      }
    }

    final location = await showLocationPicker(context: context, initialLatLng: initialLatLng);

    if (location == null) {
      return false;
    }

    await _assetApiRepository.updateLocation(remoteIds, location);
    await _remoteAssetRepository.updateLocation(remoteIds, location);

    return true;
  }

  Future<bool> editDateTime(List<String> remoteIds, BuildContext context) async {
    DateTime? initialDate;
    String? timeZone;
    Duration? offset;

    if (remoteIds.length == 1) {
      final assetId = remoteIds.first;
      final asset = await _remoteAssetRepository.get(assetId);
      if (asset == null) {
        return false;
      }

      final exifData = await _remoteAssetRepository.getExif(assetId);

      // Use EXIF timezone information if available (matching web app and display behavior)
      DateTime dt = asset.createdAt.toLocal();
      offset = dt.timeZoneOffset;

      if (exifData?.dateTimeOriginal != null) {
        timeZone = exifData!.timeZone;
        (dt, offset) = applyTimezoneOffset(dateTime: exifData.dateTimeOriginal!, timeZone: exifData.timeZone);
      }

      initialDate = dt;
    }

    final dateTime = await showDateTimePicker(
      context: context,
      initialDateTime: initialDate,
      initialTZ: timeZone,
      initialTZOffset: offset,
    );

    if (dateTime == null) {
      return false;
    }

    await applyDateTime(remoteIds, dateTime);

    return true;
  }

  @visibleForTesting
  Future<void> applyDateTime(List<String> remoteIds, String dateTime) async {
    final parsedDateTime = DateTime.parse(dateTime);
    final offset = RegExp(r'[+-]\d{2}:\d{2}$').firstMatch(dateTime)?.group(0);

    await _assetApiRepository.updateDateTime(remoteIds, dateTime);
    await _remoteAssetRepository.updateDateTime(
      remoteIds,
      parsedDateTime,
      timeZone: offset == null ? null : 'UTC$offset',
    );
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

  Future<void> stack(String userId, List<String> remoteIds) async {
    final stack = await _assetApiRepository.stack(remoteIds);
    await _remoteAssetRepository.stack(userId, stack);
  }

  Future<void> unStack(List<String> stackIds) async {
    await _remoteAssetRepository.unStack(stackIds);
    await _assetApiRepository.unStack(stackIds);
  }

  Future<int> shareAssets(
    List<BaseAsset> assets,
    BuildContext context, {
    ShareAssetType fileType = ShareAssetType.original,
    Completer<void>? cancelCompleter,
    void Function(double progress)? onAssetDownloadProgress,
  }) {
    return _assetMediaRepository.shareAssets(
      assets,
      context,
      fileType: fileType,
      cancelCompleter: cancelCompleter,
      onAssetDownloadProgress: onAssetDownloadProgress,
    );
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

  Future<void> applyEdits(String remoteId, List<AssetEdit> edits) async {
    if (edits.isEmpty) {
      await _assetApiRepository.removeEdits(remoteId);
    } else {
      await _assetApiRepository.editAsset(remoteId, edits);
    }
  }

  Future<int> _deleteLocalAssets(List<String> localIds) async {
    final deletedIds = await _assetMediaRepository.deleteAll(localIds);
    if (deletedIds.isEmpty) {
      return 0;
    }
    await _localAssetRepository.delete(deletedIds);
    return deletedIds.length;
  }
}

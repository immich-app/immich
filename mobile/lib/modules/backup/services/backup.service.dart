import 'dart:async';
import 'dart:io';

import 'package:cancellation_token_http/http.dart' as http;
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/services/uploader.service.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:openapi/api.dart';
import 'package:path/path.dart' as p;
import 'package:photo_manager/photo_manager.dart';

final backupServiceProvider = Provider(
  (ref) => BackupService(
    ref.watch(apiServiceProvider),
  ),
);

class BackupService {
  final ApiService _apiService;
  final UploadService _uploadService = UploadService();

  BackupService(this._apiService);

  Future<List<String>?> getDeviceBackupAsset() async {
    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);

    try {
      return await _apiService.assetApi.getUserAssetsByDeviceId(deviceId);
    } catch (e) {
      debugPrint('Error [getDeviceBackupAsset] ${e.toString()}');
      return null;
    }
  }

  /// Returns all assets newer than the last successful backup per album
  Future<List<AssetEntity>> buildUploadCandidates(
    HiveBackupAlbums backupAlbums,
  ) async {
    final filter = FilterOptionGroup(
      containsPathModified: true,
      orders: [const OrderOption(type: OrderOptionType.updateDate)],
    );
    final now = DateTime.now();
    final List<AssetPathEntity?> selectedAlbums =
        await _loadAlbumsWithTimeFilter(
      backupAlbums.selectedAlbumIds,
      backupAlbums.lastSelectedBackupTime,
      filter,
      now,
    );
    if (selectedAlbums.every((e) => e == null)) {
      return [];
    }
    final int allIdx = selectedAlbums.indexWhere((e) => e != null && e.isAll);
    if (allIdx != -1) {
      final List<AssetPathEntity?> excludedAlbums =
          await _loadAlbumsWithTimeFilter(
        backupAlbums.excludedAlbumsIds,
        backupAlbums.lastExcludedBackupTime,
        filter,
        now,
      );
      final List<AssetEntity> toAdd = await _fetchAssetsAndUpdateLastBackup(
        selectedAlbums.slice(allIdx, allIdx + 1),
        backupAlbums.lastSelectedBackupTime.slice(allIdx, allIdx + 1),
        now,
      );
      final List<AssetEntity> toRemove = await _fetchAssetsAndUpdateLastBackup(
        excludedAlbums,
        backupAlbums.lastExcludedBackupTime,
        now,
      );
      return toAdd.toSet().difference(toRemove.toSet()).toList();
    } else {
      return await _fetchAssetsAndUpdateLastBackup(
        selectedAlbums,
        backupAlbums.lastSelectedBackupTime,
        now,
      );
    }
  }

  Future<List<AssetPathEntity?>> _loadAlbumsWithTimeFilter(
    List<String> albumIds,
    List<DateTime> lastBackups,
    FilterOptionGroup filter,
    DateTime now,
  ) async {
    List<AssetPathEntity?> result = List.filled(albumIds.length, null);
    for (int i = 0; i < albumIds.length; i++) {
      try {
        final AssetPathEntity album =
            await AssetPathEntity.obtainPathFromProperties(
          id: albumIds[i],
          optionGroup: filter.copyWith(
            updateTimeCond: DateTimeCond(
              // subtract 2 seconds to prevent missing assets due to rounding issues
              min: lastBackups[i].subtract(const Duration(seconds: 2)),
              max: now,
            ),
          ),
          maxDateTimeToNow: false,
        );
        result[i] = album;
      } on StateError {
        // either there are no assets matching the filter criteria OR the album no longer exists
      }
    }
    return result;
  }

  Future<List<AssetEntity>> _fetchAssetsAndUpdateLastBackup(
    List<AssetPathEntity?> albums,
    List<DateTime> lastBackup,
    DateTime now,
  ) async {
    List<AssetEntity> result = [];
    for (int i = 0; i < albums.length; i++) {
      final AssetPathEntity? a = albums[i];
      if (a != null && a.lastModified?.isBefore(lastBackup[i]) != true) {
        result.addAll(
          await a.getAssetListRange(start: 0, end: await a.assetCountAsync),
        );
        lastBackup[i] = now;
      }
    }
    return result;
  }

  /// Returns a new list of assets not yet uploaded
  Future<List<AssetEntity>> removeAlreadyUploadedAssets(
    List<AssetEntity> candidates,
  ) async {
    final String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
    if (candidates.length < 10) {
      final List<CheckDuplicateAssetResponseDto?> duplicateResponse =
          await Future.wait(
        candidates.map(
          (e) => _apiService.assetApi.checkDuplicateAsset(
            CheckDuplicateAssetDto(deviceAssetId: e.id, deviceId: deviceId),
          ),
        ),
      );
      return candidates
          .whereIndexed((i, e) => duplicateResponse[i]?.isExist == false)
          .toList();
    } else {
      final List<String>? allAssetsInDatabase = await getDeviceBackupAsset();

      if (allAssetsInDatabase == null) {
        return candidates;
      }
      final Set<String> inDb = allAssetsInDatabase.toSet();
      return candidates.whereNot((e) => inDb.contains(e.id)).toList();
    }
  }

  Future<bool> backupAsset(
    Iterable<AssetEntity> assetList,
    http.CancellationToken cancelToken,
    Function(CurrentUploadAsset) onCompleted,
    Function(CurrentUploadAsset, int, int) onProgress,
    Function(CurrentUploadAsset) onUploadStarted,
    Function(ErrorUploadAsset) onError,
  ) async {
    var userInfo = Hive.box(userInfoBox);
    String deviceId = userInfo.get(deviceIdKey);
    String accessToken = userInfo.get(accessTokenKey);
    String savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    File? file;
    bool anyErrors = false;

    for (var entity in assetList) {
      try {
        if (entity.type == AssetType.video) {
          file = await entity.originFile;
        } else {
          file = await entity.originFile.timeout(const Duration(seconds: 5));
        }

        if (file != null) {
          String originalFileName = await entity.titleAsync;
          String fileNameWithoutPath =
              originalFileName.toString().split(".")[0];
          var fileExtension = p.extension(file.path);
          var mimeType = FileHelper.getMimeType(file.path);

          final uploadingAsset = CurrentUploadAsset(
            id: entity.id,
            deviceId: deviceId,
            createdAt: entity.createDateTime,
            fileName: originalFileName,
            fileType: _getAssetType(entity.type),
          );

          final assetId = uploadingAsset.id;
          final headers = {"Authorization": "Bearer $accessToken"};
          Map<String, String> formFields = {};
          formFields['deviceAssetId'] = entity.id;
          formFields['deviceId'] = deviceId;
          formFields['assetType'] = _getAssetType(entity.type);
          formFields['createdAt'] = entity.createDateTime.toIso8601String();
          formFields['modifiedAt'] = entity.modifiedDateTime.toIso8601String();
          formFields['isFavorite'] = entity.isFavorite.toString();
          formFields['fileExtension'] = fileExtension;
          formFields['duration'] = entity.videoDuration.toString();

          final mediaType = mimeType["type"] + "/" + mimeType["subType"];
          final uploadJob = UploadJob(
            assetId: assetId,
            serverEndpoint: savedEndpoint,
            originalFileName: originalFileName,
            fileNameWithoutPath: fileNameWithoutPath,
            src: file,
            mediaType: mediaType,
            headers: headers,
            formFields: formFields,
          );

          onUploadStarted(uploadingAsset);

          final uploadResult = await _uploadService.run(
            uploadJob,
            onProgress: (id, completed, size) =>
                onProgress(uploadingAsset, completed, size),
            onCompleted: (id) => onCompleted(uploadingAsset),
            onError: (id, error) => {
              onError(
                ErrorUploadAsset(
                  id: entity.id,
                  asset: entity,
                  uploadAsset: uploadingAsset,
                  createdAt: entity.createDateTime,
                  fileName: originalFileName,
                  fileType: _getAssetType(entity.type),
                  errorMessage: error.toString(),
                ),
              ),
            },
            cancelToken: cancelToken,
          );
          if (uploadResult.isCancelled) {
            return false;
          }
          if (!uploadResult.success) {
            anyErrors = true;
          }
        }
      } finally {
        if (Platform.isIOS) {
          // we opened the file in this try-block, so we should also do the cleanup here:
          file?.deleteSync();
        }
      }
    }
    return !anyErrors;
  }

  String _getAssetType(AssetType assetType) {
    switch (assetType) {
      case AssetType.audio:
        return "AUDIO";
      case AssetType.image:
        return "IMAGE";
      case AssetType.video:
        return "VIDEO";
      case AssetType.other:
        return "OTHER";
    }
  }

  Future<DeviceInfoResponseDto> setAutoBackup(
    bool status,
    String deviceId,
    DeviceTypeEnum deviceType,
  ) async {
    try {
      var updatedDeviceInfo = await _apiService.deviceInfoApi.updateDeviceInfo(
        UpdateDeviceInfoDto(
          deviceId: deviceId,
          deviceType: deviceType,
          isAutoBackup: status,
        ),
      );

      if (updatedDeviceInfo == null) {
        throw Exception("Error updating device info");
      }

      return updatedDeviceInfo;
    } catch (e) {
      debugPrint("Error setAutoBackup: ${e.toString()}");
      throw Error();
    }
  }
}

class MultipartRequest extends http.MultipartRequest {
  /// Creates a new [MultipartRequest].
  MultipartRequest(
    String method,
    Uri url, {
    required this.onProgress,
  }) : super(method, url);

  final void Function(int bytes, int totalBytes) onProgress;

  /// Freezes all mutable fields and returns a
  /// single-subscription [http.ByteStream]
  /// that will emit the request body.
  @override
  http.ByteStream finalize() {
    final byteStream = super.finalize();

    final total = contentLength;
    var bytes = 0;

    final t = StreamTransformer.fromHandlers(
      handleData: (List<int> data, EventSink<List<int>> sink) {
        bytes += data.length;
        onProgress.call(bytes, total);
        sink.add(data);
      },
    );
    final stream = byteStream.transform(t);
    return http.ByteStream(stream);
  }
}

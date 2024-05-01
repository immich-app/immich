import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:cancellation_token_http/http.dart' as http;
import 'package:path/path.dart' as p;

final backupServiceProvider = Provider(
  (ref) => BackupService(
    ref.watch(apiServiceProvider),
    ref.watch(dbProvider),
    ref.watch(appSettingsServiceProvider),
  ),
);

class BackupService {
  final httpClient = http.Client();
  final ApiService _apiService;
  final Isar _db;
  final Logger _log = Logger("BackupService");
  final AppSettingsService _appSetting;

  BackupService(this._apiService, this._db, this._appSetting);

  Future<List<String>?> getDeviceBackupAsset() async {
    final String deviceId = Store.get(StoreKey.deviceId);

    try {
      return await _apiService.assetApi.getAllUserAssetsByDeviceId(deviceId);
    } catch (e) {
      debugPrint('Error [getDeviceBackupAsset] ${e.toString()}');
      return null;
    }
  }

  Future<void> _saveDuplicatedAssetIds(List<String> deviceAssetIds) {
    final duplicates = deviceAssetIds.map((id) => DuplicatedAsset(id)).toList();
    return _db.writeTxn(() => _db.duplicatedAssets.putAll(duplicates));
  }

  /// Get duplicated asset id from database
  Future<Set<String>> getDuplicatedAssetIds() async {
    final duplicates = await _db.duplicatedAssets.where().findAll();
    return duplicates.map((e) => e.id).toSet();
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectedAlbumsQuery() =>
          _db.backupAlbums.filter().selectionEqualTo(BackupSelection.select);
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      excludedAlbumsQuery() =>
          _db.backupAlbums.filter().selectionEqualTo(BackupSelection.exclude);

  /// Returns all assets newer than the last successful backup per album
  Future<List<AssetEntity>> buildUploadCandidates(
    List<BackupAlbum> selectedBackupAlbums,
    List<BackupAlbum> excludedBackupAlbums,
  ) async {
    final filter = FilterOptionGroup(
      containsPathModified: true,
      orders: [const OrderOption(type: OrderOptionType.updateDate)],
      // title is needed to create Assets
      imageOption: const FilterOption(needTitle: true),
      videoOption: const FilterOption(needTitle: true),
    );
    final now = DateTime.now();
    final List<AssetPathEntity?> selectedAlbums =
        await _loadAlbumsWithTimeFilter(selectedBackupAlbums, filter, now);
    if (selectedAlbums.every((e) => e == null)) {
      return [];
    }
    final int allIdx = selectedAlbums.indexWhere((e) => e != null && e.isAll);
    if (allIdx != -1) {
      final List<AssetPathEntity?> excludedAlbums =
          await _loadAlbumsWithTimeFilter(excludedBackupAlbums, filter, now);
      final List<AssetEntity> toAdd = await _fetchAssetsAndUpdateLastBackup(
        selectedAlbums.slice(allIdx, allIdx + 1),
        selectedBackupAlbums.slice(allIdx, allIdx + 1),
        now,
      );
      final List<AssetEntity> toRemove = await _fetchAssetsAndUpdateLastBackup(
        excludedAlbums,
        excludedBackupAlbums,
        now,
      );
      return toAdd.toSet().difference(toRemove.toSet()).toList();
    } else {
      return await _fetchAssetsAndUpdateLastBackup(
        selectedAlbums,
        selectedBackupAlbums,
        now,
      );
    }
  }

  Future<List<AssetPathEntity?>> _loadAlbumsWithTimeFilter(
    List<BackupAlbum> albums,
    FilterOptionGroup filter,
    DateTime now,
  ) async {
    List<AssetPathEntity?> result = [];
    for (BackupAlbum a in albums) {
      try {
        final AssetPathEntity album =
            await AssetPathEntity.obtainPathFromProperties(
          id: a.id,
          optionGroup: filter.copyWith(
            updateTimeCond: DateTimeCond(
              // subtract 2 seconds to prevent missing assets due to rounding issues
              min: a.lastBackup.subtract(const Duration(seconds: 2)),
              max: now,
            ),
          ),
          maxDateTimeToNow: false,
        );
        result.add(album);
      } on StateError {
        // either there are no assets matching the filter criteria OR the album no longer exists
      }
    }
    return result;
  }

  Future<List<AssetEntity>> _fetchAssetsAndUpdateLastBackup(
    List<AssetPathEntity?> albums,
    List<BackupAlbum> backupAlbums,
    DateTime now,
  ) async {
    List<AssetEntity> result = [];
    for (int i = 0; i < albums.length; i++) {
      final AssetPathEntity? a = albums[i];
      if (a != null &&
          a.lastModified?.isBefore(backupAlbums[i].lastBackup) != true) {
        result.addAll(
          await a.getAssetListRange(start: 0, end: await a.assetCountAsync),
        );
        backupAlbums[i].lastBackup = now;
      }
    }
    return result;
  }

  /// Returns a new list of assets not yet uploaded
  Future<List<AssetEntity>> removeAlreadyUploadedAssets(
    List<AssetEntity> candidates,
  ) async {
    if (candidates.isEmpty) {
      return candidates;
    }
    final Set<String> duplicatedAssetIds = await getDuplicatedAssetIds();
    candidates = duplicatedAssetIds.isEmpty
        ? candidates
        : candidates
            .whereNot((asset) => duplicatedAssetIds.contains(asset.id))
            .toList();
    if (candidates.isEmpty) {
      return candidates;
    }
    final Set<String> existing = {};
    try {
      final String deviceId = Store.get(StoreKey.deviceId);
      final CheckExistingAssetsResponseDto? duplicates =
          await _apiService.assetApi.checkExistingAssets(
        CheckExistingAssetsDto(
          deviceAssetIds: candidates.map((e) => e.id).toList(),
          deviceId: deviceId,
        ),
      );
      if (duplicates != null) {
        existing.addAll(duplicates.existingIds);
      }
    } on ApiException {
      // workaround for older server versions or when checking for too many assets at once
      final List<String>? allAssetsInDatabase = await getDeviceBackupAsset();
      if (allAssetsInDatabase != null) {
        existing.addAll(allAssetsInDatabase);
      }
    }
    return existing.isEmpty
        ? candidates
        : candidates.whereNot((e) => existing.contains(e.id)).toList();
  }

  Future<bool> backupAsset(
    Iterable<AssetEntity> assetList,
    http.CancellationToken cancelToken,
    PMProgressHandler? pmProgressHandler,
    Function(String, String, bool) uploadSuccessCb,
    Function(int, int) uploadProgressCb,
    Function(CurrentUploadAsset) setCurrentUploadAssetCb,
    Function(ErrorUploadAsset) errorCb, {
    bool sortAssets = false,
  }) async {
    final bool isIgnoreIcloudAssets =
        _appSetting.getSetting(AppSettingsEnum.ignoreIcloudAssets);

    if (Platform.isAndroid &&
        !(await Permission.accessMediaLocation.status).isGranted) {
      // double check that permission is granted here, to guard against
      // uploading corrupt assets without EXIF information
      _log.warning("Media location permission is not granted. "
          "Cannot access original assets for backup.");
      return false;
    }
    final String deviceId = Store.get(StoreKey.deviceId);
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);
    bool anyErrors = false;
    final List<String> duplicatedAssetIds = [];

    // DON'T KNOW WHY BUT THIS HELPS BACKGROUND BACKUP TO WORK ON IOS
    if (Platform.isIOS) {
      await PhotoManager.requestPermissionExtend();
    }

    List<AssetEntity> assetsToUpload = sortAssets
        // Upload images before video assets
        // these are further sorted by using their creation date
        ? assetList.sorted(
            (a, b) {
              final cmp = a.typeInt - b.typeInt;
              if (cmp != 0) return cmp;
              return a.createDateTime.compareTo(b.createDateTime);
            },
          )
        : assetList.toList();

    for (var entity in assetsToUpload) {
      File? file;
      File? livePhotoFile;

      try {
        final isAvailableLocally =
            await entity.isLocallyAvailable(isOrigin: true);

        // Handle getting files from iCloud
        if (!isAvailableLocally && Platform.isIOS) {
          // Skip iCloud assets if the user has disabled this feature
          if (isIgnoreIcloudAssets) {
            continue;
          }

          setCurrentUploadAssetCb(
            CurrentUploadAsset(
              id: entity.id,
              fileCreatedAt: entity.createDateTime.year == 1970
                  ? entity.modifiedDateTime
                  : entity.createDateTime,
              fileName: await entity.titleAsync,
              fileType: _getAssetType(entity.type),
              iCloudAsset: true,
            ),
          );

          file = await entity.loadFile(progressHandler: pmProgressHandler);
          livePhotoFile = await entity.loadFile(
            withSubtype: true,
            progressHandler: pmProgressHandler,
          );
        } else {
          if (entity.type == AssetType.video) {
            file = await entity.originFile;
          } else {
            file = await entity.originFile.timeout(const Duration(seconds: 5));
            if (entity.isLivePhoto) {
              livePhotoFile = await entity.originFileWithSubtype
                  .timeout(const Duration(seconds: 5));
            }
          }
        }

        if (file != null) {
          String originalFileName = await entity.titleAsync;
          var fileStream = file.openRead();
          var assetRawUploadData = http.MultipartFile(
            "assetData",
            fileStream,
            file.lengthSync(),
            filename: originalFileName,
          );

          var req = MultipartRequest(
            'POST',
            Uri.parse('$savedEndpoint/asset/upload'),
            onProgress: ((bytes, totalBytes) =>
                uploadProgressCb(bytes, totalBytes)),
          );
          req.headers["x-immich-user-token"] = Store.get(StoreKey.accessToken);
          req.headers["Transfer-Encoding"] = "chunked";

          req.fields['deviceAssetId'] = entity.id;
          req.fields['deviceId'] = deviceId;
          req.fields['fileCreatedAt'] =
              entity.createDateTime.toUtc().toIso8601String();
          req.fields['fileModifiedAt'] =
              entity.modifiedDateTime.toUtc().toIso8601String();
          req.fields['isFavorite'] = entity.isFavorite.toString();
          req.fields['duration'] = entity.videoDuration.toString();

          req.files.add(assetRawUploadData);

          var fileSize = file.lengthSync();

          if (entity.isLivePhoto) {
            if (livePhotoFile != null) {
              final livePhotoTitle = p.setExtension(
                originalFileName,
                p.extension(livePhotoFile.path),
              );
              final fileStream = livePhotoFile.openRead();
              final livePhotoRawUploadData = http.MultipartFile(
                "livePhotoData",
                fileStream,
                livePhotoFile.lengthSync(),
                filename: livePhotoTitle,
              );
              req.files.add(livePhotoRawUploadData);
              fileSize += livePhotoFile.lengthSync();
            } else {
              _log.warning(
                "Failed to obtain motion part of the livePhoto - $originalFileName",
              );
            }
          }

          setCurrentUploadAssetCb(
            CurrentUploadAsset(
              id: entity.id,
              fileCreatedAt: entity.createDateTime.year == 1970
                  ? entity.modifiedDateTime
                  : entity.createDateTime,
              fileName: originalFileName,
              fileType: _getAssetType(entity.type),
              fileSize: fileSize,
              iCloudAsset: false,
            ),
          );

          var response =
              await httpClient.send(req, cancellationToken: cancelToken);

          if (response.statusCode == 200) {
            // asset is a duplicate (already exists on the server)
            duplicatedAssetIds.add(entity.id);
            uploadSuccessCb(entity.id, deviceId, true);
          } else if (response.statusCode == 201) {
            // stored a new asset on the server
            uploadSuccessCb(entity.id, deviceId, false);
          } else {
            var data = await response.stream.bytesToString();
            var error = jsonDecode(data);
            var errorMessage = error['message'] ?? error['error'];

            debugPrint(
              "Error(${error['statusCode']}) uploading ${entity.id} | $originalFileName | Created on ${entity.createDateTime} | ${error['error']}",
            );

            errorCb(
              ErrorUploadAsset(
                asset: entity,
                id: entity.id,
                fileCreatedAt: entity.createDateTime,
                fileName: originalFileName,
                fileType: _getAssetType(entity.type),
                errorMessage: errorMessage,
              ),
            );

            if (errorMessage == "Quota has been exceeded!") {
              anyErrors = true;
              break;
            }
            continue;
          }
        }
      } on http.CancelledException {
        debugPrint("Backup was cancelled by the user");
        anyErrors = true;
        break;
      } catch (e) {
        debugPrint("ERROR backupAsset: ${e.toString()}");
        anyErrors = true;
        continue;
      } finally {
        if (Platform.isIOS) {
          try {
            await file?.delete();
            await livePhotoFile?.delete();
          } catch (e) {
            debugPrint("ERROR deleting file: ${e.toString()}");
          }
        }
      }
    }
    if (duplicatedAssetIds.isNotEmpty) {
      await _saveDuplicatedAssetIds(duplicatedAssetIds);
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
}

class MultipartRequest extends http.MultipartRequest {
  /// Creates a new [MultipartRequest].
  MultipartRequest(
    super.method,
    super.url, {
    required this.onProgress,
  });

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

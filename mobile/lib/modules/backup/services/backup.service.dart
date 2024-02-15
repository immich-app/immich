import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/upload_check_response.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/shared/models/asset.dart' hide AssetType;
import 'package:immich_mobile/shared/models/store.dart';
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

  Future<BulkUploadCheckResponse?> _bulkUploadCheck(List<Asset> assets) async {
    try {
      final dto = await _apiService.assetApi.checkBulkUpload(
        AssetBulkUploadCheckDto(
          assets: assets
              .where((a) => a.localId != null)
              .map(
                (e) => AssetBulkUploadCheckItem(
                  checksum: e.checksum,
                  id: e.localId!,
                ),
              )
              .toList(),
        ),
      );

      return dto != null ? BulkUploadCheckResponse.fromDto(dto) : null;
    } catch (e) {
      debugPrint('Error [bulkUploadCheck] ${e.toString()}');
      return null;
    }
  }

  Future<Iterable<Asset>> remoteAlreadyUploaded(List<Asset> assets) async {
    final uploadCheck = await _bulkUploadCheck(assets);
    if (uploadCheck == null) {
      _log.warning("Cannot determine duplicates. Skipping backup for now");
      return [];
    }

    return uploadCheck.toBeUploaded
        .map((c) => assets.firstWhere((a) => a.localId == c));
  }

  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      selectedAlbumsQuery() =>
          _db.backupAlbums.filter().selectionEqualTo(BackupSelection.select);
  QueryBuilder<BackupAlbum, BackupAlbum, QAfterFilterCondition>
      excludedAlbumsQuery() =>
          _db.backupAlbums.filter().selectionEqualTo(BackupSelection.exclude);

  Future<bool> backupAsset(
    Iterable<Asset> assetList,
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

    // DON'T KNOW WHY BUT THIS HELPS BACKGROUND BACKUP TO WORK ON IOS
    if (Platform.isIOS) {
      await PhotoManager.requestPermissionExtend();
    }

    List<Asset> assetsToUpload = sortAssets
        // Upload images before video assets
        // these are further sorted by using their creation date
        ? assetList.sorted(
            (a, b) {
              final cmp = a.type.index - b.type.index;
              if (cmp != 0) return cmp;
              return a.fileCreatedAt.compareTo(b.fileCreatedAt);
            },
          )
        : assetList.toList();

    for (final asset in assetsToUpload) {
      if (!asset.isLocal) {
        _log.severe("Asset - ${asset.id} is not a local asset");
        continue;
      }

      final entity = (await AssetEntity.fromId(asset.localId!));
      if (entity == null) {
        _log.severe("Cannot fetch asset entity for - ${asset.localId}");
        continue;
      }

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
              iCloudAsset: false,
            ),
          );

          var response =
              await httpClient.send(req, cancellationToken: cancelToken);

          if (response.statusCode == 200) {
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

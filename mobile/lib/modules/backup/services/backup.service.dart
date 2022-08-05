import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';
import 'package:immich_mobile/modules/backup/models/error_upload_asset.model.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:openapi/api.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;
import 'package:cancellation_token_http/http.dart' as http;

final backupServiceProvider = Provider(
  (ref) => BackupService(
    ref.watch(apiServiceProvider),
  ),
);

class BackupService {
  final ApiService _apiService;

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

  backupAsset(
    Set<AssetEntity> assetList,
    http.CancellationToken cancelToken,
    Function(String, String) singleAssetDoneCb,
    Function(int, int) uploadProgressCb,
    Function(CurrentUploadAsset) setCurrentUploadAssetCb,
    Function(ErrorUploadAsset) errorCb,
  ) async {
    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
    String savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    File? file;

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
          var fileStream = file.openRead();
          var assetRawUploadData = http.MultipartFile(
            "assetData",
            fileStream,
            file.lengthSync(),
            filename: fileNameWithoutPath,
            contentType: MediaType(
              mimeType["type"],
              mimeType["subType"],
            ),
          );

          var box = Hive.box(userInfoBox);

          var req = MultipartRequest(
            'POST',
            Uri.parse('$savedEndpoint/asset/upload'),
            onProgress: ((bytes, totalBytes) =>
                uploadProgressCb(bytes, totalBytes)),
          );
          req.headers["Authorization"] = "Bearer ${box.get(accessTokenKey)}";

          req.fields['deviceAssetId'] = entity.id;
          req.fields['deviceId'] = deviceId;
          req.fields['assetType'] = _getAssetType(entity.type);
          req.fields['createdAt'] = entity.createDateTime.toIso8601String();
          req.fields['modifiedAt'] = entity.modifiedDateTime.toIso8601String();
          req.fields['isFavorite'] = entity.isFavorite.toString();
          req.fields['fileExtension'] = fileExtension;
          req.fields['duration'] = entity.videoDuration.toString();

          req.files.add(assetRawUploadData);

          setCurrentUploadAssetCb(
            CurrentUploadAsset(
              id: entity.id,
              createdAt: entity.createDateTime,
              fileName: originalFileName,
              fileType: _getAssetType(entity.type),
            ),
          );

          var response = await req.send(cancellationToken: cancelToken);

          if (response.statusCode == 201) {
            singleAssetDoneCb(entity.id, deviceId);
          } else {
            var data = await response.stream.bytesToString();
            var error = jsonDecode(data);

            debugPrint(
              "Error(${error['statusCode']}) uploading ${entity.id} | $originalFileName | Created on ${entity.createDateTime} | ${error['error']}",
            );

            errorCb(
              ErrorUploadAsset(
                asset: entity,
                id: entity.id,
                createdAt: entity.createDateTime,
                fileName: originalFileName,
                fileType: _getAssetType(entity.type),
                errorMessage: error['error'],
              ),
            );
            continue;
          }
        }
      } on http.CancelledException {
        debugPrint("Backup was cancelled by the user");
        return;
      } catch (e) {
        debugPrint("ERROR backupAsset: ${e.toString()}");
        continue;
      } finally {
        if (Platform.isIOS) {
          file?.deleteSync();
        }
      }
    }
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

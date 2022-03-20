import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/shared/models/device_info.model.dart';
import 'package:immich_mobile/utils/dio_http_interceptor.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;

class BackupService {
  final NetworkService _networkService = NetworkService();

  Future<List<String>> getDeviceBackupAsset() async {
    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);

    Response response = await _networkService.getRequest(url: "asset/$deviceId");
    List<dynamic> result = jsonDecode(response.toString());

    return result.cast<String>();
  }

  backupAsset(List<AssetEntity> assetList, CancelToken cancelToken, Function(String, String) singleAssetDoneCb,
      Function(int, int) uploadProgress) async {
    var dio = Dio();
    dio.interceptors.add(AuthenticatedRequestInterceptor());

    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
    String savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    File? file;

    MultipartFile assetRawUploadData;
    MultipartFile thumbnailUploadData;

    for (var entity in assetList) {
      try {
        if (entity.type == AssetType.video) {
          file = await entity.originFile;
        } else {
          file = await entity.originFile.timeout(const Duration(seconds: 5));
        }

        if (file != null) {
          FormData formData;
          String originalFileName = await entity.titleAsync;
          String fileNameWithoutPath = originalFileName.toString().split(".")[0];
          var fileExtension = p.extension(file.path);
          var mimeType = FileHelper.getMimeType(file.path);
          assetRawUploadData = await MultipartFile.fromFile(
            file.path,
            filename: fileNameWithoutPath,
            contentType: MediaType(
              mimeType["type"],
              mimeType["subType"],
            ),
          );
          formData = FormData.fromMap({
            'deviceAssetId': entity.id,
            'deviceId': deviceId,
            'assetType': _getAssetType(entity.type),
            'createdAt': entity.createDateTime.toIso8601String(),
            'modifiedAt': entity.modifiedDateTime.toIso8601String(),
            'isFavorite': entity.isFavorite,
            'fileExtension': fileExtension,
            'duration': entity.videoDuration,
            'assetData': [assetRawUploadData]
          });

          // Build thumbnail multipart data
          var thumbnailData = await entity.thumbDataWithSize(1280, 720);
          if (thumbnailData != null) {
            thumbnailUploadData = MultipartFile.fromBytes(
              List.from(thumbnailData),
              filename: fileNameWithoutPath,
              contentType: MediaType(
                "image",
                "jpeg",
              ),
            );

            // Send thumbnail data if it is exist
            formData = FormData.fromMap({
              'deviceAssetId': entity.id,
              'deviceId': deviceId,
              'assetType': _getAssetType(entity.type),
              'createdAt': entity.createDateTime.toIso8601String(),
              'modifiedAt': entity.modifiedDateTime.toIso8601String(),
              'isFavorite': entity.isFavorite,
              'fileExtension': fileExtension,
              'duration': entity.videoDuration,
              'thumbnailData': [thumbnailUploadData],
              'assetData': [assetRawUploadData]
            });
          }

          Response res = await dio.post(
            '$savedEndpoint/asset/upload',
            data: formData,
            cancelToken: cancelToken,
            onSendProgress: (sent, total) => uploadProgress(sent, total),
          );

          if (res.statusCode == 201) {
            singleAssetDoneCb(entity.id, deviceId);
          }
        }
      } on DioError catch (e) {
        debugPrint("DioError backupAsset: ${e.response}");
        break;
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

  Future<DeviceInfoRemote> setAutoBackup(bool status, String deviceId, String deviceType) async {
    var res = await _networkService.patchRequest(url: 'device-info', data: {
      "isAutoBackup": status,
      "deviceId": deviceId,
      "deviceType": deviceType,
    });

    return DeviceInfoRemote.fromJson(res.toString());
  }
}

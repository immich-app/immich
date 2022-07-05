import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/shared/services/network.service.dart';
import 'package:immich_mobile/shared/models/device_info.model.dart';
import 'package:immich_mobile/utils/files_helper.dart';
import 'package:photo_manager/photo_manager.dart';
import 'package:http_parser/http_parser.dart';
import 'package:path/path.dart' as p;
import 'package:cancellation_token_http/http.dart' as http;

final backupServiceProvider =
    Provider((ref) => BackupService(ref.watch(networkServiceProvider)));

class BackupService {
  final NetworkService _networkService;
  BackupService(this._networkService);

  Future<List<String>> getDeviceBackupAsset() async {
    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);

    Response response =
        await _networkService.getRequest(url: "asset/$deviceId");
    List<dynamic> result = jsonDecode(response.toString());

    return result.cast<String>();
  }

  backupAsset(
      Set<AssetEntity> assetList,
      http.CancellationToken cancelToken,
      Function(String, String) singleAssetDoneCb,
      Function(int, int) uploadProgress) async {
    String deviceId = Hive.box(userInfoBox).get(deviceIdKey);
    String savedEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    File? file;

    http.MultipartFile? thumbnailUploadData;

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
              'POST', Uri.parse('$savedEndpoint/asset/upload'),
              onProgress: ((bytes, totalBytes) =>
                  uploadProgress(bytes, totalBytes)));
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

          var res = await req.send(cancellationToken: cancelToken);

          if (res.statusCode == 201) {
            singleAssetDoneCb(entity.id, deviceId);
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

  Future<DeviceInfoRemote> setAutoBackup(
      bool status, String deviceId, String deviceType) async {
    var res = await _networkService.patchRequest(url: 'device-info', data: {
      "isAutoBackup": status,
      "deviceId": deviceId,
      "deviceType": deviceType,
    });

    return DeviceInfoRemote.fromJson(res.toString());
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

import 'dart:convert';
import 'dart:io';

import 'package:cancellation_token_http/http.dart' as http;
import 'package:flutter/cupertino.dart';
import 'package:http_parser/http_parser.dart';
import 'package:immich_mobile/modules/backup/services/backup.service.dart';

class UploadJob {
  final String assetId;
  final String serverEndpoint;
  final String originalFileName;
  final String fileNameWithoutPath;
  final File src;
  final String mediaType;
  final Map<String, String> headers;
  final Map<String, String> formFields;

  const UploadJob({
    required this.assetId,
    required this.serverEndpoint,
    required this.originalFileName,
    required this.fileNameWithoutPath,
    required this.src,
    required this.mediaType,
    required this.headers,
    required this.formFields,
  });
}

class UploadResult {
  final bool success;
  final bool isCancelled;

  UploadResult({required this.success, required this.isCancelled});
}

class UploadService {
  final _httpClient = http.Client();

  UploadService();

  Future<UploadResult> run(
    UploadJob job, {
    required Function(String, int, int) onProgress,
    required Function(String) onCompleted,
    required Function(String assetId, Object error) onError,
    http.CancellationToken? cancelToken,
  }) async {
    var mediaType = MediaType.parse(job.mediaType);
    var assetId = job.assetId;
    var originalFileName = job.originalFileName;
    var fileNameWithoutPath = job.fileNameWithoutPath;

    var file = job.src;
    var fileSize = await file.length();
    var fileStream = file.openRead();

    var assetRawUploadData = http.MultipartFile(
      "assetData",
      fileStream,
      fileSize,
      filename: fileNameWithoutPath,
      contentType: mediaType,
    );

    var uploadTarget = Uri.parse("${job.serverEndpoint}/asset/upload");
    var req = MultipartRequest(
      'POST',
      uploadTarget,
      onProgress: (bytes, totalBytes) => onProgress(assetId, bytes, totalBytes),
    );
    var formFields = job.formFields;
    req.fields.addAll(formFields);
    req.files.add(assetRawUploadData);
    var headers = job.headers;
    // TODO: leave authorization header up to caller?
    //req.headers["Authorization"] = "Bearer $accessToken";
    req.headers.addAll(headers);

    bool success = false;
    try {
      var response = await _httpClient.send(
        req,
        cancellationToken: cancelToken,
      );
      if (response.statusCode == 201) {
        success = true;
        onCompleted(assetId);
      } else {
        var data = await response.stream.bytesToString();
        var error = jsonDecode(data);

        final errorMsg =
            "Error(${response.statusCode}) body='$data' uploading $fileNameWithoutPath | $originalFileName | ${error['error']}";
        debugPrint(errorMsg);
        onError(assetId, errorMsg);
      }
    } on http.CancelledException {
      debugPrint("Backup was cancelled by the user");
      return UploadResult(success: false, isCancelled: true);
    } catch (e) {
      debugPrint("ERROR backupAsset: ${e.toString()}");
      onError(assetId, e);
    }

    return UploadResult(success: success, isCancelled: false);
  }
}

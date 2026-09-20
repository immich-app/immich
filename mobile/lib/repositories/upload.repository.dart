import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:convert/convert.dart';
import 'package:crypto/crypto.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/utils/debug_print.dart';
import 'package:logging/logging.dart';

final uploadRepositoryProvider = Provider((ref) {
  final chunkedUploadEnabled = ref.watch(
    serverInfoProvider.select((s) => s.serverConfig.chunkedUploadEnabled),
  );
  return UploadRepository(chunkedUploadEnabled: chunkedUploadEnabled);
});

class UploadRepository {
  final Logger logger = Logger('UploadRepository');
  final bool chunkedUploadEnabled;
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadRepository({this.chunkedUploadEnabled = true}) {
    FileDownloader().registerCallbacks(
      group: kBackupGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kBackupLivePhotoGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
    FileDownloader().registerCallbacks(
      group: kManualUploadGroup,
      taskStatusCallback: (update) => onUploadStatus?.call(update),
      taskProgressCallback: (update) => onTaskProgress?.call(update),
    );
  }

  Future<List<bool>> enqueueBackgroundAll(List<UploadTask> tasks) {
    return FileDownloader().enqueueAll(tasks);
  }

  Future<void> deleteDatabaseRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  Future<int> reset(String group) {
    return FileDownloader().reset(group: group);
  }

  /// Get a list of tasks that are ENQUEUED or RUNNING
  Future<List<Task>> getActiveTasks(String group) {
    return FileDownloader().allTasks(group: group);
  }

  Future<void> start() {
    return FileDownloader().start();
  }

  Future<UploadResult> uploadFile({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    String? checksum,
    Client? httpClient,
  }) async {
    final int fileSize;
    try {
      fileSize = await file.length();
    } catch (e) {
      return UploadResult.error(errorMessage: 'Unable to read file size: $e');
    }

    // Use the resumable/chunked upload protocol when the server has it
    // enabled and the file is larger than the per-request body limit
    // (e.g. Cloudflare's 100 MB cap). When disabled, fall back to the
    // legacy single-request upload.
    if (chunkedUploadEnabled && fileSize > kChunkedUploadThresholdBytes) {
      return _uploadChunked(
        file: file,
        originalFileName: originalFileName,
        fields: fields,
        fileSize: fileSize,
        cancelToken: cancelToken,
        onProgress: onProgress,
        logContext: logContext,
        checksum: checksum,
        httpClient: httpClient,
      );
    }

    return _uploadSingle(
      file: file,
      originalFileName: originalFileName,
      fields: fields,
      cancelToken: cancelToken,
      onProgress: onProgress,
      logContext: logContext,
      httpClient: httpClient,
    );
  }

  Future<UploadResult> _uploadSingle({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    Client? httpClient,
  }) async {
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);

    ProgressMultipartRequest buildRequest() {
      final request = ProgressMultipartRequest(
        'POST',
        Uri.parse('$savedEndpoint/assets'),
        abortTrigger: cancelToken?.future,
        onProgress: onProgress,
      );
      request.fields.addAll(fields);
      request.files.add(MultipartFile("assetData", file.openRead(), file.lengthSync(), filename: originalFileName));
      return request;
    }

    try {
      final client = httpClient ?? NetworkRepository.client;
      StreamedResponse response;
      try {
        response = await client.send(buildRequest());
      } on RequestAbortedException {
        rethrow;
      } on ClientException catch (error) {
        logger.warning("Upload $logContext failed before a response, resending once: $error");
        response = await client.send(buildRequest());
      }

      final responseBodyString = await response.stream.bytesToString();

      if (![200, 201].contains(response.statusCode)) {
        String? errorMessage;

        if (response.statusCode == 413) {
          errorMessage = 'Error(413) File is too large to upload';
          return UploadResult.error(statusCode: response.statusCode, errorMessage: errorMessage);
        }

        try {
          final error = jsonDecode(responseBodyString);
          errorMessage = error['message'] ?? error['error'];
        } catch (_) {
          errorMessage = responseBodyString.isNotEmpty
              ? responseBodyString
              : 'Upload failed with status ${response.statusCode}';
        }

        return UploadResult.error(statusCode: response.statusCode, errorMessage: errorMessage);
      }

      try {
        final responseBody = jsonDecode(responseBodyString);
        return UploadResult.success(remoteAssetId: responseBody['id'] as String);
      } catch (e) {
        return UploadResult.error(errorMessage: 'Failed to parse server response');
      }
    } on RequestAbortedException {
      logger.warning("Upload $logContext was cancelled");
      return UploadResult.cancelled();
    } catch (error, stackTrace) {
      logger.warning("Error uploading $logContext: $error: $stackTrace");
      return UploadResult.error(errorMessage: error.toString());
    }
  }

  Future<void> _uploadSingleChunk({
    required int chunkIndex,
    required List<int> bytes,
    required String uploadId,
    required String savedEndpoint,
    required String originalFileName,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    Client? httpClient,
  }) async {
    final client = httpClient ?? NetworkRepository.client;

    // Upload a single chunk as multipart form data. The filename must be
    // provided so the server's asset-type validation (canUploadFile) accepts
    // the chunk; without it the part has no filename and is rejected.
    final request = ProgressMultipartRequest(
      'POST',
      Uri.parse('$savedEndpoint/assets/upload/$uploadId/chunk/$chunkIndex'),
      abortTrigger: cancelToken?.future,
      onProgress: onProgress,
    );
    request.files.add(
      MultipartFile('assetData', Stream.value(bytes), bytes.length, filename: originalFileName),
    );

    final response = await client.send(request);
    final responseBodyString = await response.stream.bytesToString();
    if (![200, 201].contains(response.statusCode)) {
      throw Exception('Chunk $chunkIndex upload failed with status ${response.statusCode}: $responseBodyString');
    }
  }

  Future<UploadResult> _uploadChunked({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    required int fileSize,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    String? checksum,
    Client? httpClient,
  }) async {
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);
    final client = httpClient ?? NetworkRepository.client;

    // The server requires the full file's SHA1 checksum when initializing a
    // chunked upload (it uses it for duplicate detection and integrity checking
    // at completion). Compute it from the file if the caller did not supply one.
    final fileChecksum = checksum ?? await _sha1Base64(file);

    // Initialize the upload session.
    final initBody = jsonEncode({
      'filename': originalFileName,
      'fileSize': fileSize,
      'checksum': fileChecksum,
      'fileCreatedAt': fields['fileCreatedAt'],
      'fileModifiedAt': fields['fileModifiedAt'],
      'isFavorite': fields['isFavorite'] ?? 'false',
      if (fields.containsKey('duration')) 'duration': fields['duration'],
      if (fields.containsKey('visibility')) 'visibility': fields['visibility'],
      if (fields.containsKey('metadata')) 'metadata': jsonDecode(fields['metadata']!),
    });

    final initResponse = await client.post(
      Uri.parse('$savedEndpoint/assets/upload/init'),
      headers: {'content-type': 'application/json'},
      body: initBody,
    );

    if (initResponse.statusCode != 201 && initResponse.statusCode != 200) {
      return UploadResult.error(
        statusCode: initResponse.statusCode,
        errorMessage: 'Failed to initialize upload: ${initResponse.body}',
      );
    }

    final initJson = jsonDecode(initResponse.body) as Map<String, dynamic>;

    // If the asset already exists, return the duplicate immediately.
    final duplicate = initJson['duplicate'] as bool? ?? false;
    final assetId = initJson['assetId'] as String?;
    if (duplicate && assetId != null) {
      return UploadResult.success(remoteAssetId: assetId);
    }

    final uploadId = initJson['uploadId'] as String;
    final chunkSize = initJson['chunkSize'] as int;
    final raw = await file.readAsBytes();

    var chunkIndex = 0;
    var offset = 0;
    while (offset < fileSize) {
      if (cancelToken?.isCompleted == true) {
        return UploadResult.cancelled();
      }

      final end = (offset + chunkSize).clamp(0, fileSize);
      final chunk = raw.sublist(offset, end);
      try {
        await _uploadSingleChunk(
          chunkIndex: chunkIndex,
          bytes: chunk,
          uploadId: uploadId,
          savedEndpoint: savedEndpoint,
          originalFileName: originalFileName,
          cancelToken: cancelToken,
          onProgress: onProgress != null ? (bytes, _) => onProgress(offset + bytes, fileSize) : null,
          logContext: logContext,
          httpClient: httpClient,
        );
      } on RequestAbortedException {
        logger.warning("Upload $logContext was cancelled during chunk $chunkIndex");
        return UploadResult.cancelled();
      } on Exception catch (error) {
        logger.warning("Error uploading chunk $chunkIndex for $logContext: $error");
        return UploadResult.error(errorMessage: error.toString());
      }

      offset = end;
      chunkIndex++;
    }

    // Complete the upload, passing back the fields that should override the init ones.
    final completeResponse = await client.post(
      Uri.parse('$savedEndpoint/assets/upload/$uploadId/complete'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({
        if (fields['fileCreatedAt'] != null) 'fileCreatedAt': fields['fileCreatedAt'],
        if (fields['fileModifiedAt'] != null) 'fileModifiedAt': fields['fileModifiedAt'],
        if (fields['isFavorite'] != null) 'isFavorite': fields['isFavorite'],
        if (fields.containsKey('duration')) 'duration': fields['duration'],
        if (fields.containsKey('metadata')) 'metadata': jsonDecode(fields['metadata']!),
      }),
    );

    if (completeResponse.statusCode != 201 && completeResponse.statusCode != 200) {
      return UploadResult.error(
        statusCode: completeResponse.statusCode,
        errorMessage: 'Failed to complete upload: ${completeResponse.body}',
      );
    }

    try {
      final responseBody = jsonDecode(completeResponse.body);
      return UploadResult.success(remoteAssetId: responseBody['id'] as String);
    } catch (e) {
      return UploadResult.error(errorMessage: 'Failed to parse server response');
    }
  }

  /// Computes the base64-encoded SHA1 checksum of [file], matching the format
  /// the server expects for chunked upload init (see [fromChecksum] on the
  /// server, which decodes 28-character strings as base64).
  Future<String> _sha1Base64(File file) async {
    final digest = await _sha1Digest(file);
    return base64.encode(digest.bytes);
  }

  Future<Digest> _sha1Digest(File file) async {
    final sink = AccumulatorSink<Digest>();
    final input = file.openRead();
    final output = sha1.startChunkedConversion(sink);
    await input.forEach(output.add);
    output.close();
    return sink.events.single;
  }
}

class ProgressMultipartRequest extends MultipartRequest with Abortable {
  ProgressMultipartRequest(super.method, super.url, {this.abortTrigger, this.onProgress});

  @override
  final Future<void>? abortTrigger;

  final void Function(int bytes, int totalBytes)? onProgress;

  @override
  ByteStream finalize() {
    final byteStream = super.finalize();
    if (onProgress == null) {
      return byteStream;
    }

    final total = contentLength;
    var bytes = 0;
    final stream = byteStream.transform(
      StreamTransformer.fromHandlers(
        handleData: (List<int> data, EventSink<List<int>> sink) {
          bytes += data.length;
          onProgress!(bytes, total);
          sink.add(data);
        },
      ),
    );
    return ByteStream(stream);
  }
}

class UploadResult {
  final bool isSuccess;
  final bool isCancelled;
  final String? remoteAssetId;
  final String? errorMessage;
  final int? statusCode;

  const UploadResult({
    required this.isSuccess,
    required this.isCancelled,
    this.remoteAssetId,
    this.errorMessage,
    this.statusCode,
  });

  factory UploadResult.success({required String remoteAssetId}) {
    return UploadResult(isSuccess: true, isCancelled: false, remoteAssetId: remoteAssetId);
  }

  factory UploadResult.error({String? errorMessage, int? statusCode}) {
    return UploadResult(isSuccess: false, isCancelled: false, errorMessage: errorMessage, statusCode: statusCode);
  }

  factory UploadResult.cancelled() {
    return const UploadResult(isSuccess: false, isCancelled: true);
  }
}

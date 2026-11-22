import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:immich_mobile/platform/network_api.g.dart';
import 'package:logging/logging.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  final Logger logger = Logger('UploadRepository');
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  /// The generated Pigeon host API. Kept as a field rather than pulled from a
  /// provider so this repository stays free of Riverpod wiring (platform.provider
  /// already imports this file, so importing it back would be a cycle).
  final NetworkApi _networkApi = NetworkApi();

  UploadRepository() {
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

  /// Uploads through the native Cronet uploader, which streams the file off disk.
  ///
  /// Always returns a result; a broken transfer comes back as [UploadResult.error]
  /// rather than a silent null.
  Future<UploadResult> _uploadFileStreaming({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    Completer<void>? cancelToken,
  }) async {
    // Resend once when the request dies before any response arrives, matching the
    // Dart path. Only when nothing reached the server: a resend after a partial
    // body could leave a half-written asset plus a duplicate.
    for (var attempt = 0; ; attempt++) {
      // Unique per attempt, not just per asset: a retry must not collide with the
      // previous attempt's native request entry.
      final progressKey = '$logContext:${file.path}#$_uploadKeySalt-${_streamingUploadSeq++}';
      var progressBytes = 0;
      // Always subscribe, even when the caller does not want progress: the byte
      // count is what decides whether a failed attempt may be resent, and callers
      // like the background worker pass no onProgress at all.
      _streamingProgressListeners[progressKey] = (sent, total) {
        progressBytes = sent;
        onProgress?.call(sent, total);
      };

      // Abort the native upload when the caller cancels, otherwise the native
      // thread keeps streaming after the backup stopped. Register even for an
      // already-completed token: then() fires immediately, covering the
      // "cancelled while queued" window.
      if (cancelToken != null) {
        unawaited(cancelToken.future.then((_) => _networkApi.cancelStreamingUpload(progressKey)).catchError((_) {}));
      }

      try {
        final endpoint = Store.get(StoreKey.serverEndpoint);
        final result = await _networkApi.uploadFileStreaming(
          '$endpoint/assets',
          file.path,
          originalFileName,
          'assetData',
          mimeTypeForFile(originalFileName),
          fields,
          progressKey,
        );

        if (result.isSuccess) {
          final body = result.body ?? '';
          try {
            final decoded = jsonDecode(body);
            final id = decoded['id'];
            if (id is String) {
              return UploadResult.success(remoteAssetId: id);
            }
            return UploadResult.error(errorMessage: 'Failed to parse server response');
          } catch (_) {
            return UploadResult.error(errorMessage: 'Failed to parse server response');
          }
        }

        // Only an abort we asked for is a cancellation. Cronet also cancels the
        // request itself on stall or hard deadline, which is a transport failure:
        // treating that as a cancel sets shouldAbortUpload and kills the batch.
        if (cancelToken?.isCompleted == true) {
          return UploadResult.cancelled();
        }

        // statusCode 0 means no HTTP response at all. Only then, and only with
        // nothing on the wire, is a resend safe. The byte count comes from the
        // native side because the progress callback is optional.
        if (result.statusCode == 0 && result.bytesSent == 0 && attempt == 0) {
          logger.warning("Streaming upload $logContext failed before any data was sent, resending once");
          continue;
        }

        // Mirror the Dart path's error extraction so both routes report the same
        // text. Callers match on the message ("Quota has been exceeded!" stops the
        // whole batch), so handing them the raw JSON body would break that.
        final body = result.body ?? '';
        final message = extractErrorMessage(statusCode: result.statusCode, body: body);
        logger.warning("Streaming upload $logContext failed: $message");
        return UploadResult.error(statusCode: result.statusCode, errorMessage: message);
      } catch (error, stackTrace) {
        logger.warning("Streaming upload $logContext threw", error, stackTrace);
        if (cancelToken?.isCompleted == true) {
          return UploadResult.cancelled();
        }
        if (progressBytes == 0 && attempt == 0) {
          // Nothing was reported as sent, so the body almost certainly never
          // reached the server. The counter is fed from the native progress
          // callback, which is subscribed even when the caller passed no
          // onProgress -- otherwise this was always 0 and every exception
          // looked like a safe retry.
          logger.warning("Streaming upload $logContext threw before any data was sent, resending once");
          continue;
        }
        // Do NOT fall back to the Dart client here. It only applies when the engine
        // is missing; an exception means the transfer broke, and package:cronet_http
        // would buffer the whole file -- the OOM this path exists to avoid.
        return UploadResult.error(errorMessage: 'Native streaming upload failed: $error');
      } finally {
        _streamingProgressListeners.remove(progressKey);
      }
    }
  }

  /// Progress callbacks are routed by [progressKey] so concurrent uploads do not
  /// overwrite each other's progress.
  static final Map<String, void Function(int, int)> _streamingProgressListeners = {};

  /// Salt per isolate, keeping keys distinct if the native request tables ever
  /// become process-wide again.
  static final String _uploadKeySalt = math.Random().nextInt(0x7FFFFFFF).toRadixString(36);
  static int _streamingUploadSeq = 0;

  static void dispatchStreamingProgress(String key, int transferred, int total) {
    _streamingProgressListeners[key]?.call(transferred, total);
  }

  static String mimeTypeForFile(String fileName) {
    final ext = fileName.split('.').last.toLowerCase();
    return switch (ext) {
      'jpg' || 'jpeg' => 'image/jpeg',
      'png' => 'image/png',
      'heic' => 'image/heic',
      'gif' => 'image/gif',
      'webp' => 'image/webp',
      'mp4' => 'video/mp4',
      'mov' => 'video/quicktime',
      '3gp' => 'video/3gpp',
      'mkv' => 'video/x-matroska',
      'avi' => 'video/x-msvideo',
      _ => 'application/octet-stream',
    };
  }

  /// Turns a failed upload response into the same message the Dart path produces.
  /// Callers compare this string (the quota case stops the whole batch).
  static String extractErrorMessage({required int statusCode, required String body}) {
    if (statusCode == 413) {
      return 'Error(413) File is too large to upload';
    }
    try {
      final decoded = jsonDecode(body);
      final message = decoded is Map ? (decoded['message'] ?? decoded['error']) : null;
      if (message is String && message.isNotEmpty) {
        return message;
      }
    } catch (_) {
      // Not JSON; fall through to the raw body.
    }
    return body.isNotEmpty ? body : 'Upload failed with status $statusCode';
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
    Client? httpClient,
  }) async {
    // A worker can be cancelled while it sits in the queue between picking an
    // asset and reaching this call. Starting the transfer anyway would push the
    // whole file to the server with nothing left to abort it.
    if (cancelToken?.isCompleted == true) {
      return UploadResult.cancelled();
    }

    // package:cronet_http buffers the entire body in memory before handing it to
    // the native layer, so anything larger than the heap is unuploadable.
    //
    // mTLS users stay on the buffered path: Cronet cannot present a client
    // certificate. Their client is OkHttp, which streams the body itself.
    if (CurrentPlatform.isAndroid && !NetworkRepository.usingMtls) {
      // Not lengthSync(): this runs on the UI isolate, and a stat() per upload is
      // a blocking syscall on the frame budget.
      final length = await file.length();
      if (length > kStreamingUploadThreshold) {
        // No fallback to the Dart client on failure: it buffers the whole body in
        // memory, so retrying a >16 MB file that way is exactly the OOM this path
        // exists to prevent. Report the failure instead.
        return _uploadFileStreaming(
          file: file,
          originalFileName: originalFileName,
          fields: fields,
          onProgress: onProgress,
          logContext: logContext,
          cancelToken: cancelToken,
        );
      }
    }

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
        logger.warning("Upload $logContext failed before a response, resending once", error);
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
      logger.warning("Error uploading $logContext", error, stackTrace);
      return UploadResult(isSuccess: false, isCancelled: false, errorMessage: error.toString(), error: error);
    }
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
  final Object? error;

  const UploadResult({
    required this.isSuccess,
    required this.isCancelled,
    this.remoteAssetId,
    this.errorMessage,
    this.statusCode,
    this.error,
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

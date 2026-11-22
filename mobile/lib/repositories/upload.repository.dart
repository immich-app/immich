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

  /// 写成字段：platform.provider 已经 import 这个文件，用 provider 会成环。
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

  /// 走原生 Cronet uploader，从磁盘流式发。
  Future<UploadResult> _uploadFileStreaming({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
    Completer<void>? cancelToken,
  }) async {
    // 只重发一次，而且只在什么都没到服务器时。
    for (var attempt = 0; ; attempt++) {
      // 每次尝试一个 key，重试不能和上一条撞。
      final progressKey = '$logContext:${file.path}#$_uploadKeySalt-${_streamingUploadSeq++}';
      var progressBytes = 0;
      // 无条件订阅：字节数决定能不能重发，而后台 worker 根本不传 onProgress。
      _streamingProgressListeners[progressKey] = (sent, total) {
        progressBytes = sent;
        onProgress?.call(sent, total);
      };

      // 否则备份停了原生线程还在传。then() 也覆盖已经完成的那种。
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

        // 只有我们主动中断才算取消；Cronet 卡住也会取消，那会把整批干掉。
        if (cancelToken?.isCompleted == true) {
          return UploadResult.cancelled();
        }

        // statusCode 0 表示根本没拿到响应。
        if (result.statusCode == 0 && result.bytesSent == 0 && attempt == 0) {
          logger.warning("Streaming upload $logContext failed before any data was sent, resending once");
          continue;
        }

        // 文案和 Dart 路径一致，调用方是按消息文本判断的。
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
          // 一个字节都没报过，body 多半没发出去。
          logger.warning("Streaming upload $logContext threw before any data was sent, resending once");
          continue;
        }
        // 不回退到 Dart 客户端，它会把整个文件读进内存。
        return UploadResult.error(errorMessage: 'Native streaming upload failed: $error');
      } finally {
        _streamingProgressListeners.remove(progressKey);
      }
    }
  }

  /// 按 [progressKey] 派发，并发上传不会互相覆盖。
  static final Map<String, void Function(int, int)> _streamingProgressListeners = {};

  /// 每个 isolate 一个盐。
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

  /// 和 Dart 路径产出同样的消息，配额那条会中断整批。
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
      // 不是 JSON，直接用原始 body。
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
    // 排队时被取消，硬发出去就没东西能中断它了。
    if (cancelToken?.isCompleted == true) {
      return UploadResult.cancelled();
    }

    // cronet_http 会把整个 body 读进内存，大过堆就传不了。
    // mTLS 用户仍走 buffered 路径。
    if (CurrentPlatform.isAndroid && !NetworkRepository.usingMtls) {
      // 不用 lengthSync，这跑在 UI isolate 上。
      final length = await file.length();
      if (length > kStreamingUploadThreshold) {
        // 不回退：换 Dart 客户端重试，正是这里要避免的 OOM。
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

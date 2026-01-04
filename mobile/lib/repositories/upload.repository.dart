import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:logging/logging.dart';
import 'package:immich_mobile/utils/debug_print.dart';

class UploadTaskWithFile {
  final File file;
  final UploadTask task;

  const UploadTaskWithFile({required this.file, required this.task});
}

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  final Logger logger = Logger('UploadRepository');
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

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

  Future<void> enqueueBackground(UploadTask task) {
    return FileDownloader().enqueue(task);
  }

  Future<List<bool>> enqueueBackgroundAll(List<UploadTask> tasks) {
    return FileDownloader().enqueueAll(tasks);
  }

  Future<void> deleteDatabaseRecords(String group) {
    return FileDownloader().database.deleteAllRecords(group: group);
  }

  Future<bool> cancelAll(String group) {
    return FileDownloader().cancelAll(group: group);
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

  Future<void> getUploadInfo() async {
    final [enqueuedTasks, runningTasks, canceledTasks, waitingTasks, pausedTasks] = await Future.wait([
      FileDownloader().database.allRecordsWithStatus(TaskStatus.enqueued, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.running, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.canceled, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.waitingToRetry, group: kBackupGroup),
      FileDownloader().database.allRecordsWithStatus(TaskStatus.paused, group: kBackupGroup),
    ]);

    dPrint(
      () =>
          """
      Upload Info:
      Enqueued: ${enqueuedTasks.length}
      Running: ${runningTasks.length}
      Canceled: ${canceledTasks.length}
      Waiting: ${waitingTasks.length}
      Paused: ${pausedTasks.length}
    """,
    );
  }

  Future<void> backupWithDartClient(Iterable<UploadTaskWithFile> tasks, CancellationToken cancelToken) async {
    final httpClient = Client();
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);

    Logger logger = Logger('UploadRepository');
    for (final candidate in tasks) {
      if (cancelToken.isCancelled) {
        logger.warning("Backup was cancelled by the user");
        break;
      }

      try {
        final fileStream = candidate.file.openRead();
        final assetRawUploadData = MultipartFile(
          "assetData",
          fileStream,
          candidate.file.lengthSync(),
          filename: candidate.task.filename,
        );

        final baseRequest = MultipartRequest('POST', Uri.parse('$savedEndpoint/assets'));

        baseRequest.headers.addAll(candidate.task.headers);
        baseRequest.fields.addAll(candidate.task.fields);
        baseRequest.files.add(assetRawUploadData);

        final response = await httpClient.send(baseRequest, cancellationToken: cancelToken);

        final responseBody = jsonDecode(await response.stream.bytesToString());

        if (![200, 201].contains(response.statusCode)) {
          final error = responseBody;

          logger.warning(
            "Error(${error['statusCode']}) uploading ${candidate.task.filename} | Created on ${candidate.task.fields["fileCreatedAt"]} | ${error['error']}",
          );

          continue;
        }
      } on CancelledException {
        logger.warning("Backup was cancelled by the user");
        break;
      } catch (error, stackTrace) {
        logger.warning("Error backup asset: ${error.toString()}: $stackTrace");
        continue;
      }
    }
  }

  Future<UploadResult> uploadSingleAsset({
    required File file,
    required String originalFileName,
    required Map<String, String> headers,
    required Map<String, String> fields,
    required Client httpClient,
    required CancellationToken cancelToken,
    required void Function(int bytes, int totalBytes) onProgress,
  }) async {
    return _uploadFile(
      file: file,
      originalFileName: originalFileName,
      headers: headers,
      fields: fields,
      httpClient: httpClient,
      cancelToken: cancelToken,
      onProgress: onProgress,
      logContext: 'assetUpload',
    );
  }

  /// Upload live photo video part and return the video asset ID
  Future<String?> uploadLivePhotoVideo({
    required File livePhotoFile,
    required String originalFileName,
    required Map<String, String> headers,
    required Map<String, String> fields,
    required Client httpClient,
    required CancellationToken cancelToken,
    required void Function(int bytes, int totalBytes) onProgress,
  }) async {
    final result = await _uploadFile(
      file: livePhotoFile,
      originalFileName: originalFileName,
      headers: headers,
      fields: fields,
      httpClient: httpClient,
      cancelToken: cancelToken,
      onProgress: onProgress,
      logContext: 'livePhotoVideoUpload',
    );

    if (result.isSuccess && result.remoteAssetId != null) {
      return result.remoteAssetId;
    }

    return null;
  }

  Future<UploadResult> _uploadFile({
    required File file,
    required String originalFileName,
    required Map<String, String> headers,
    required Map<String, String> fields,
    required Client httpClient,
    required CancellationToken cancelToken,
    required void Function(int bytes, int totalBytes) onProgress,
    required String logContext,
  }) async {
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);

    try {
      final fileStream = file.openRead();
      final assetRawUploadData = MultipartFile("assetData", fileStream, file.lengthSync(), filename: originalFileName);

      final baseRequest = CustomMultipartRequest('POST', Uri.parse('$savedEndpoint/assets'), onProgress: onProgress);

      baseRequest.headers.addAll(headers);
      baseRequest.fields.addAll(fields);
      baseRequest.files.add(assetRawUploadData);

      final response = await httpClient.send(baseRequest, cancellationToken: cancelToken);
      final responseBody = jsonDecode(await response.stream.bytesToString());

      if (![200, 201].contains(response.statusCode)) {
        final error = responseBody;
        final errorMessage = error['message'] ?? error['error'];

        logger.warning("Error(${error['statusCode']}) uploading $logContext | $originalFileName | ${error['error']}");

        return UploadResult.error(statusCode: response.statusCode, errorMessage: errorMessage);
      }

      return UploadResult.success(remoteAssetId: responseBody['id'] as String);
    } on CancelledException {
      logger.warning("Upload $logContext was cancelled");
      return UploadResult.cancelled();
    } catch (error, stackTrace) {
      logger.warning("Error uploading $logContext: ${error.toString()}: $stackTrace");
      return UploadResult.error(errorMessage: error.toString());
    }
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

class CustomMultipartRequest extends MultipartRequest {
  CustomMultipartRequest(super.method, super.url, {required this.onProgress});

  final void Function(int bytes, int totalBytes) onProgress;

  @override
  ByteStream finalize() {
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
    return ByteStream(stream);
  }
}

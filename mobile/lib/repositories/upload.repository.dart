import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/network.repository.dart';
import 'package:logging/logging.dart';
import 'package:http/http.dart';

final uploadRepositoryProvider = Provider((ref) => UploadRepository());

class UploadRepository {
  final Logger logger = Logger('UploadRepository');
  void Function(TaskStatusUpdate)? onUploadStatus;
  void Function(TaskProgressUpdate)? onTaskProgress;

  UploadRepository() {
    final downloader = FileDownloader();
    for (final group in const [kBackupGroup, kBackupLivePhotoGroup, kManualUploadGroup]) {
      downloader.registerCallbacks(
        group: group,
        taskStatusCallback: onUploadStatus,
        taskProgressCallback: onTaskProgress,
      );
    }
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

  Future<UploadResult> uploadFile({
    required File file,
    required String originalFileName,
    required Map<String, String> fields,
    required Completer<void>? cancelToken,
    void Function(int bytes, int totalBytes)? onProgress,
    required String logContext,
  }) async {
    final String savedEndpoint = Store.get(StoreKey.serverEndpoint);
    final baseRequest = ProgressMultipartRequest(
      'POST',
      Uri.parse('$savedEndpoint/assets'),
      abortTrigger: cancelToken?.future,
      onProgress: onProgress,
    );

    try {
      final fileStream = file.openRead();
      final assetRawUploadData = MultipartFile("assetData", fileStream, file.lengthSync(), filename: originalFileName);

      baseRequest.fields.addAll(fields);
      baseRequest.files.add(assetRawUploadData);

      final StreamedResponse(:statusCode, :stream) = await NetworkRepository.client.send(baseRequest);
      final responseBodyString = await stream.bytesToString();

      return switch ((statusCode, _tryJsonDecode(responseBodyString))) {
        (200 || 201, {'id': String id}) => UploadSuccess(remoteAssetId: id),
        (413, _) => const UploadError(statusCode: 413, message: 'File is too large to upload'),
        (_, {'message': String message}) => UploadError(statusCode: statusCode, message: message),
        _ => UploadError(statusCode: statusCode, message: 'Upload failed with status $statusCode'),
      };
    } on RequestAbortedException {
      logger.warning("Upload $logContext was cancelled");
      return const UploadCancelled();
    } catch (error, stackTrace) {
      logger.warning("Error uploading $logContext: ${error.toString()}: $stackTrace");
      return UploadError(message: error.toString());
    }
  }

  @pragma('vm:prefer-inline')
  Map? _tryJsonDecode(String s) {
    try {
      return (jsonDecode(s) as Map);
    } catch (_) {
      return null;
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

sealed class UploadResult {
  const UploadResult();
}

final class UploadSuccess extends UploadResult {
  final String remoteAssetId;

  const UploadSuccess({required this.remoteAssetId});
}

final class UploadError extends UploadResult {
  final String message;
  final int? statusCode;

  const UploadError({required this.message, this.statusCode});
}

final class UploadCancelled extends UploadResult {
  const UploadCancelled();
}

// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';

class DownloadInfo {
  final String fileName;
  final double progress;

  DownloadInfo({
    required this.fileName,
    required this.progress,
  });

  DownloadInfo copyWith({
    String? fileName,
    double? progress,
  }) {
    return DownloadInfo(
      fileName: fileName ?? this.fileName,
      progress: progress ?? this.progress,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'fileName': fileName,
      'progress': progress,
    };
  }

  factory DownloadInfo.fromMap(Map<String, dynamic> map) {
    return DownloadInfo(
      fileName: map['fileName'] as String,
      progress: map['progress'] as double,
    );
  }

  String toJson() => json.encode(toMap());

  factory DownloadInfo.fromJson(String source) =>
      DownloadInfo.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'DownloadProgress(fileName: $fileName, progress: $progress)';

  @override
  bool operator ==(covariant DownloadInfo other) {
    if (identical(this, other)) return true;

    return other.fileName == fileName && other.progress == progress;
  }

  @override
  int get hashCode => fileName.hashCode ^ progress.hashCode;
}

class DownloadState {
  // enum
  final TaskStatus downloadStatus;
  final Map<String, DownloadInfo> taskProgress;
  final bool showProgress;
  DownloadState({
    required this.downloadStatus,
    required this.taskProgress,
    required this.showProgress,
  });

  DownloadState copyWith({
    TaskStatus? downloadStatus,
    Map<String, DownloadInfo>? taskProgress,
    bool? showProgress,
  }) {
    return DownloadState(
      downloadStatus: downloadStatus ?? this.downloadStatus,
      taskProgress: taskProgress ?? this.taskProgress,
      showProgress: showProgress ?? this.showProgress,
    );
  }

  @override
  String toString() =>
      'DownloadState(downloadStatus: $downloadStatus, taskProgress: $taskProgress, showProgress: $showProgress)';

  @override
  bool operator ==(covariant DownloadState other) {
    if (identical(this, other)) return true;
    final mapEquals = const DeepCollectionEquality().equals;

    return other.downloadStatus == downloadStatus &&
        mapEquals(other.taskProgress, taskProgress) &&
        other.showProgress == showProgress;
  }

  @override
  int get hashCode =>
      downloadStatus.hashCode ^ taskProgress.hashCode ^ showProgress.hashCode;
}

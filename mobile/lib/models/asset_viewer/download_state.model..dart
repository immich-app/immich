// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:collection/collection.dart';

class DownloadProgress {
  double progress;
  DownloadProgress({
    required this.progress,
  });

  DownloadProgress copyWith({
    double? progress,
  }) {
    return DownloadProgress(
      progress: progress ?? this.progress,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'progress': progress,
    };
  }

  factory DownloadProgress.fromMap(Map<String, dynamic> map) {
    return DownloadProgress(
      progress: map['progress'] as double,
    );
  }

  String toJson() => json.encode(toMap());

  factory DownloadProgress.fromJson(String source) =>
      DownloadProgress.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'DownloadProgress(progress: $progress)';

  @override
  bool operator ==(covariant DownloadProgress other) {
    if (identical(this, other)) return true;

    return other.progress == progress;
  }

  @override
  int get hashCode => progress.hashCode;
}

class DownloadState {
  // enum
  final TaskStatus downloadStatus;
  final Map<String, DownloadProgress> taskProgress;
  final bool showProgress;
  DownloadState({
    required this.downloadStatus,
    required this.taskProgress,
    required this.showProgress,
  });

  DownloadState copyWith({
    TaskStatus? downloadStatus,
    Map<String, DownloadProgress>? taskProgress,
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

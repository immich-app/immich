// ignore_for_file: public_member_api_docs, sort_constructors_first

import 'dart:convert';

import 'package:background_downloader/background_downloader.dart';
import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:photo_manager/photo_manager.dart';

import 'package:immich_mobile/models/backup/available_album.model.dart';
import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';
import 'package:immich_mobile/models/server_info/server_disk_info.model.dart';

enum BackUpProgressEnum {
  idle,
  inProgress,
  manualInProgress,
  inBackground,
  done
}

class BackUpState {
  // enum
  final BackUpProgressEnum progress;

  final List<UploadTask> uploadTasks;

  BackUpState({
    required this.progress,
    required this.uploadTasks,
  });

  BackUpState copyWith({
    BackUpProgressEnum? progress,
    List<UploadTask>? uploadTasks,
  }) {
    return BackUpState(
      progress: progress ?? this.progress,
      uploadTasks: uploadTasks ?? this.uploadTasks,
    );
  }

  @override
  String toString() =>
      'BackUpState(progress: $progress, uploadTasks: $uploadTasks)';

  @override
  bool operator ==(covariant BackUpState other) {
    if (identical(this, other)) return true;
    final listEquals = const DeepCollectionEquality().equals;

    return other.progress == progress &&
        listEquals(other.uploadTasks, uploadTasks);
  }

  @override
  int get hashCode => progress.hashCode ^ uploadTasks.hashCode;
}

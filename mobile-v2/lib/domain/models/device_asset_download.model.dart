import 'dart:async';
import 'dart:io';

enum DeviceAssetRequestStatus {
  preparing,
  downloading,
  success,
  failed,
}

class DeviceAssetDownloadHandler {
  DeviceAssetDownloadHandler() : stream = const Stream.empty() {
    assert(
      Platform.isIOS || Platform.isMacOS,
      '$runtimeType should only be used on iOS or macOS.',
    );
  }

  /// A stream that provides information about the download status and progress of the asset being downloaded.
  Stream<DeviceAssetDownloadState> stream;
}

class DeviceAssetDownloadState {
  final double progress;
  final DeviceAssetRequestStatus status;

  const DeviceAssetDownloadState({
    required this.progress,
    required this.status,
  });

  DeviceAssetDownloadState copyWith({
    double? progress,
    DeviceAssetRequestStatus? status,
  }) {
    return DeviceAssetDownloadState(
      progress: progress ?? this.progress,
      status: status ?? this.status,
    );
  }

  @override
  String toString() {
    return 'DeviceAssetDownloadState(progress: $progress, status: $status)';
  }

  @override
  bool operator ==(covariant DeviceAssetDownloadState other) {
    return other.progress == progress && other.status == status;
  }

  @override
  int get hashCode {
    return progress.hashCode ^ status.hashCode;
  }
}

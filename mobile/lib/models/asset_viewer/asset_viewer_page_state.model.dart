import 'package:background_downloader/background_downloader.dart';

class AssetViewerPageState {
  // enum
  final TaskStatus downloadStatus;
  final TaskProgressUpdate? downloadProgress;
  final bool showProgress;

  AssetViewerPageState({
    required this.downloadStatus,
    required this.downloadProgress,
    required this.showProgress,
  });

  AssetViewerPageState copyWith({
    TaskStatus? downloadStatus,
    TaskProgressUpdate? downloadProgress,
    bool? showProgress,
  }) {
    return AssetViewerPageState(
      downloadStatus: downloadStatus ?? this.downloadStatus,
      downloadProgress: downloadProgress ?? this.downloadProgress,
      showProgress: showProgress ?? this.showProgress,
    );
  }

  @override
  String toString() =>
      'AssetViewerPageState(downloadStatus: $downloadStatus, downloadProgress: $downloadProgress, showProgress: $showProgress)';

  @override
  bool operator ==(covariant AssetViewerPageState other) {
    if (identical(this, other)) return true;

    return other.downloadStatus == downloadStatus &&
        other.downloadProgress == downloadProgress &&
        other.showProgress == showProgress;
  }

  @override
  int get hashCode =>
      downloadStatus.hashCode ^
      downloadProgress.hashCode ^
      showProgress.hashCode;
}

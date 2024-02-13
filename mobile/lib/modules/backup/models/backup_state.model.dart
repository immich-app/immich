import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';

enum BackUpProgressEnum {
  idle,
  inProgress,
  manualInProgress,
  inBackground,
  done
}

class BackUpState {
  // enum
  final BackUpProgressEnum backupProgress;
  final double progressInPercentage;
  final double iCloudDownloadProgress;
  final CancellationToken cancelToken;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  const BackUpState({
    required this.backupProgress,
    required this.progressInPercentage,
    required this.iCloudDownloadProgress,
    required this.cancelToken,
    required this.currentUploadAsset,
  });

  BackUpState copyWith({
    BackUpProgressEnum? backupProgress,
    double? progressInPercentage,
    double? iCloudDownloadProgress,
    CancellationToken? cancelToken,
    CurrentUploadAsset? currentUploadAsset,
  }) {
    return BackUpState(
      backupProgress: backupProgress ?? this.backupProgress,
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      iCloudDownloadProgress:
          iCloudDownloadProgress ?? this.iCloudDownloadProgress,
      cancelToken: cancelToken ?? this.cancelToken,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
    );
  }

  @override
  String toString() {
    return 'BackUpState(backupProgress: $backupProgress, progressInPercentage: $progressInPercentage, iCloudDownloadProgress: $iCloudDownloadProgress, cancelToken: $cancelToken, currentUploadAsset: $currentUploadAsset)';
  }

  @override
  bool operator ==(covariant BackUpState other) {
    if (identical(this, other)) return true;

    return other.backupProgress == backupProgress &&
        other.progressInPercentage == progressInPercentage &&
        other.iCloudDownloadProgress == iCloudDownloadProgress &&
        other.cancelToken == cancelToken &&
        other.currentUploadAsset == currentUploadAsset;
  }

  @override
  int get hashCode {
    return backupProgress.hashCode ^
        progressInPercentage.hashCode ^
        iCloudDownloadProgress.hashCode ^
        cancelToken.hashCode ^
        currentUploadAsset.hashCode;
  }
}

import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';

class ManualUploadState {
  final CancellationToken cancelToken;

  final double progressInPercentage;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  /// Manual Upload
  final int manualUploadsTotal;
  final int manualUploadFailures;
  final int manualUploadSuccess;

  const ManualUploadState({
    required this.progressInPercentage,
    required this.cancelToken,
    required this.currentUploadAsset,
    required this.manualUploadsTotal,
    required this.manualUploadFailures,
    required this.manualUploadSuccess,
  });

  ManualUploadState copyWith({
    double? progressInPercentage,
    CancellationToken? cancelToken,
    CurrentUploadAsset? currentUploadAsset,
    int? manualUploadsTotal,
    int? manualUploadFailures,
    int? manualUploadSuccess,
  }) {
    return ManualUploadState(
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
      manualUploadsTotal: manualUploadsTotal ?? this.manualUploadsTotal,
      manualUploadFailures: manualUploadFailures ?? this.manualUploadFailures,
      manualUploadSuccess: manualUploadSuccess ?? this.manualUploadSuccess,
    );
  }

  @override
  String toString() {
    return 'ManualUploadState(progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, currentUploadAsset: $currentUploadAsset, manualUploadsTotal: $manualUploadsTotal, manualUploadSuccess: $manualUploadSuccess, manualUploadFailures: $manualUploadFailures)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ManualUploadState &&
        other.progressInPercentage == progressInPercentage &&
        other.cancelToken == cancelToken &&
        other.currentUploadAsset == currentUploadAsset &&
        other.manualUploadsTotal == manualUploadsTotal &&
        other.manualUploadFailures == manualUploadFailures &&
        other.manualUploadSuccess == manualUploadSuccess;
  }

  @override
  int get hashCode {
    return progressInPercentage.hashCode ^
        cancelToken.hashCode ^
        currentUploadAsset.hashCode ^
        manualUploadsTotal.hashCode ^
        manualUploadFailures.hashCode ^
        manualUploadSuccess.hashCode;
  }
}

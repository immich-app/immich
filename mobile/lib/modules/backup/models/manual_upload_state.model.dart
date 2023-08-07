import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';

class ManualUploadState {
  final CancellationToken cancelToken;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;

  final bool showDetailedNotification;

  /// Manual Upload Stats
  final int manualUploadsTotal;
  final int manualUploadFailures;
  final int manualUploadSuccess;
  final double progressInPercentage;

  const ManualUploadState({
    required this.progressInPercentage,
    required this.cancelToken,
    required this.currentUploadAsset,
    required this.manualUploadsTotal,
    required this.manualUploadFailures,
    required this.manualUploadSuccess,
    required this.showDetailedNotification,
  });

  ManualUploadState copyWith({
    double? progressInPercentage,
    CancellationToken? cancelToken,
    CurrentUploadAsset? currentUploadAsset,
    int? manualUploadsTotal,
    int? manualUploadFailures,
    int? manualUploadSuccess,
    bool? showDetailedNotification,
  }) {
    return ManualUploadState(
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
      manualUploadsTotal: manualUploadsTotal ?? this.manualUploadsTotal,
      manualUploadFailures: manualUploadFailures ?? this.manualUploadFailures,
      manualUploadSuccess: manualUploadSuccess ?? this.manualUploadSuccess,
      showDetailedNotification:
          showDetailedNotification ?? this.showDetailedNotification,
    );
  }

  @override
  String toString() {
    return 'ManualUploadState(progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, currentUploadAsset: $currentUploadAsset, manualUploadsTotal: $manualUploadsTotal, manualUploadSuccess: $manualUploadSuccess, manualUploadFailures: $manualUploadFailures, showDetailedNotification: $showDetailedNotification)';
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
        other.manualUploadSuccess == manualUploadSuccess &&
        other.showDetailedNotification == showDetailedNotification;
  }

  @override
  int get hashCode {
    return progressInPercentage.hashCode ^
        cancelToken.hashCode ^
        currentUploadAsset.hashCode ^
        manualUploadsTotal.hashCode ^
        manualUploadFailures.hashCode ^
        manualUploadSuccess.hashCode ^
        showDetailedNotification.hashCode;
  }
}

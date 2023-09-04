import 'package:cancellation_token_http/http.dart';
import 'package:immich_mobile/modules/backup/models/current_upload_asset.model.dart';

class ManualUploadState {
  final CancellationToken cancelToken;

  // Current Backup Asset
  final CurrentUploadAsset currentUploadAsset;
  final int currentAssetIndex;

  final bool showDetailedNotification;

  /// Manual Upload Stats
  final int totalAssetsToUpload;
  final int successfulUploads;
  final double progressInPercentage;

  const ManualUploadState({
    required this.progressInPercentage,
    required this.cancelToken,
    required this.currentUploadAsset,
    required this.totalAssetsToUpload,
    required this.currentAssetIndex,
    required this.successfulUploads,
    required this.showDetailedNotification,
  });

  ManualUploadState copyWith({
    double? progressInPercentage,
    CancellationToken? cancelToken,
    CurrentUploadAsset? currentUploadAsset,
    int? totalAssetsToUpload,
    int? successfulUploads,
    int? currentAssetIndex,
    bool? showDetailedNotification,
  }) {
    return ManualUploadState(
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      cancelToken: cancelToken ?? this.cancelToken,
      currentUploadAsset: currentUploadAsset ?? this.currentUploadAsset,
      totalAssetsToUpload: totalAssetsToUpload ?? this.totalAssetsToUpload,
      currentAssetIndex: currentAssetIndex ?? this.currentAssetIndex,
      successfulUploads: successfulUploads ?? this.successfulUploads,
      showDetailedNotification:
          showDetailedNotification ?? this.showDetailedNotification,
    );
  }

  @override
  String toString() {
    return 'ManualUploadState(progressInPercentage: $progressInPercentage, cancelToken: $cancelToken, currentUploadAsset: $currentUploadAsset, totalAssetsToUpload: $totalAssetsToUpload, successfulUploads: $successfulUploads, currentAssetIndex: $currentAssetIndex, showDetailedNotification: $showDetailedNotification)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ManualUploadState &&
        other.progressInPercentage == progressInPercentage &&
        other.cancelToken == cancelToken &&
        other.currentUploadAsset == currentUploadAsset &&
        other.totalAssetsToUpload == totalAssetsToUpload &&
        other.currentAssetIndex == currentAssetIndex &&
        other.successfulUploads == successfulUploads &&
        other.showDetailedNotification == showDetailedNotification;
  }

  @override
  int get hashCode {
    return progressInPercentage.hashCode ^
        cancelToken.hashCode ^
        currentUploadAsset.hashCode ^
        totalAssetsToUpload.hashCode ^
        currentAssetIndex.hashCode ^
        successfulUploads.hashCode ^
        showDetailedNotification.hashCode;
  }
}

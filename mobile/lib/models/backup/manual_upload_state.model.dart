import 'package:cancellation_token_http/http.dart';
import 'package:collection/collection.dart';

import 'package:immich_mobile/models/backup/current_upload_asset.model.dart';

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
  final String progressInFileSize;
  final double progressInFileSpeed;
  final List<double> progressInFileSpeeds;
  final DateTime progressInFileSpeedUpdateTime;
  final int progressInFileSpeedUpdateSentBytes;

  const ManualUploadState({
    required this.progressInPercentage,
    required this.progressInFileSize,
    required this.progressInFileSpeed,
    required this.progressInFileSpeeds,
    required this.progressInFileSpeedUpdateTime,
    required this.progressInFileSpeedUpdateSentBytes,
    required this.cancelToken,
    required this.currentUploadAsset,
    required this.totalAssetsToUpload,
    required this.currentAssetIndex,
    required this.successfulUploads,
    required this.showDetailedNotification,
  });

  ManualUploadState copyWith({
    double? progressInPercentage,
    String? progressInFileSize,
    double? progressInFileSpeed,
    List<double>? progressInFileSpeeds,
    DateTime? progressInFileSpeedUpdateTime,
    int? progressInFileSpeedUpdateSentBytes,
    CancellationToken? cancelToken,
    CurrentUploadAsset? currentUploadAsset,
    int? totalAssetsToUpload,
    int? successfulUploads,
    int? currentAssetIndex,
    bool? showDetailedNotification,
  }) {
    return ManualUploadState(
      progressInPercentage: progressInPercentage ?? this.progressInPercentage,
      progressInFileSize: progressInFileSize ?? this.progressInFileSize,
      progressInFileSpeed: progressInFileSpeed ?? this.progressInFileSpeed,
      progressInFileSpeeds: progressInFileSpeeds ?? this.progressInFileSpeeds,
      progressInFileSpeedUpdateTime:
          progressInFileSpeedUpdateTime ?? this.progressInFileSpeedUpdateTime,
      progressInFileSpeedUpdateSentBytes: progressInFileSpeedUpdateSentBytes ??
          this.progressInFileSpeedUpdateSentBytes,
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
    return 'ManualUploadState(progressInPercentage: $progressInPercentage, progressInFileSize: $progressInFileSize, progressInFileSpeed: $progressInFileSpeed, progressInFileSpeeds: $progressInFileSpeeds, progressInFileSpeedUpdateTime: $progressInFileSpeedUpdateTime, progressInFileSpeedUpdateSentBytes: $progressInFileSpeedUpdateSentBytes, cancelToken: $cancelToken, currentUploadAsset: $currentUploadAsset, totalAssetsToUpload: $totalAssetsToUpload, successfulUploads: $successfulUploads, currentAssetIndex: $currentAssetIndex, showDetailedNotification: $showDetailedNotification)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    final collectionEquals = const DeepCollectionEquality().equals;

    return other is ManualUploadState &&
        other.progressInPercentage == progressInPercentage &&
        other.progressInFileSize == progressInFileSize &&
        other.progressInFileSpeed == progressInFileSpeed &&
        collectionEquals(other.progressInFileSpeeds, progressInFileSpeeds) &&
        other.progressInFileSpeedUpdateTime == progressInFileSpeedUpdateTime &&
        other.progressInFileSpeedUpdateSentBytes ==
            progressInFileSpeedUpdateSentBytes &&
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
        progressInFileSize.hashCode ^
        progressInFileSpeed.hashCode ^
        progressInFileSpeeds.hashCode ^
        progressInFileSpeedUpdateTime.hashCode ^
        progressInFileSpeedUpdateSentBytes.hashCode ^
        cancelToken.hashCode ^
        currentUploadAsset.hashCode ^
        totalAssetsToUpload.hashCode ^
        currentAssetIndex.hashCode ^
        successfulUploads.hashCode ^
        showDetailedNotification.hashCode;
  }
}

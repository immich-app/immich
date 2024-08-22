import 'package:immich_mobile/models/backup/backup_candidate.model.dart';

class SuccessUploadAsset {
  final BackupCandidate asset;
  final String deviceAssetId;
  final bool isDuplicate;

  SuccessUploadAsset({
    required this.asset,
    required this.deviceAssetId,
    required this.isDuplicate,
  });

  SuccessUploadAsset copyWith({
    BackupCandidate? asset,
    String? deviceAssetId,
    bool? isDuplicate,
  }) {
    return SuccessUploadAsset(
      asset: asset ?? this.asset,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      isDuplicate: isDuplicate ?? this.isDuplicate,
    );
  }

  @override
  String toString() =>
      'SuccessUploadAsset(asset: $asset, deviceId: $deviceAssetId, isDuplicate: $isDuplicate)';

  @override
  bool operator ==(covariant SuccessUploadAsset other) {
    if (identical(this, other)) return true;

    return other.asset == asset &&
        other.deviceAssetId == deviceAssetId &&
        other.isDuplicate == isDuplicate;
  }

  @override
  int get hashCode =>
      asset.hashCode ^ deviceAssetId.hashCode ^ isDuplicate.hashCode;
}

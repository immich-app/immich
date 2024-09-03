import 'package:immich_mobile/models/backup/backup_candidate.model.dart';

class SuccessUploadAsset {
  final BackupCandidate candidate;
  final String remoteAssetId;
  final bool isDuplicate;

  SuccessUploadAsset({
    required this.candidate,
    required this.remoteAssetId,
    required this.isDuplicate,
  });

  SuccessUploadAsset copyWith({
    BackupCandidate? candidate,
    String? remoteAssetId,
    bool? isDuplicate,
  }) {
    return SuccessUploadAsset(
      candidate: candidate ?? this.candidate,
      remoteAssetId: remoteAssetId ?? this.remoteAssetId,
      isDuplicate: isDuplicate ?? this.isDuplicate,
    );
  }

  @override
  String toString() =>
      'SuccessUploadAsset(asset: $candidate, remoteAssetId: $remoteAssetId, isDuplicate: $isDuplicate)';

  @override
  bool operator ==(covariant SuccessUploadAsset other) {
    if (identical(this, other)) return true;

    return other.candidate == candidate &&
        other.remoteAssetId == remoteAssetId &&
        other.isDuplicate == isDuplicate;
  }

  @override
  int get hashCode =>
      candidate.hashCode ^ remoteAssetId.hashCode ^ isDuplicate.hashCode;
}

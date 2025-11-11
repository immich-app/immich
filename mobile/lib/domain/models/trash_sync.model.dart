enum TrashActionType { trashed, restored }

class TrashSyncDecision {
  final String assetId;
  final String checksum;
  final bool? isSyncApproved;
  final TrashActionType actionType;

  const TrashSyncDecision({
    required this.assetId,
    required this.checksum,
    this.isSyncApproved,
    required this.actionType,
  });

  @override
  String toString() {
    return '''TrashSyncDecision {
  assetId: $assetId,
  checksum: $checksum,
  isSyncApproved: $isSyncApproved,
  syncActionType: $actionType,
}''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! TrashSyncDecision) return false;
    return assetId == other.assetId &&
        checksum == other.checksum &&
        isSyncApproved == other.isSyncApproved &&
        actionType == other.actionType;
  }

  @override
  int get hashCode => assetId.hashCode ^ checksum.hashCode ^ (isSyncApproved?.hashCode ?? 0) ^ actionType.hashCode;

  TrashSyncDecision copyWith({
    String? assetId,
    String? checksum,
    bool? isSyncApproved,
    TrashActionType? syncActionType,
  }) {
    return TrashSyncDecision(
      assetId: assetId ?? this.assetId,
      checksum: checksum ?? this.checksum,
      isSyncApproved: isSyncApproved ?? this.isSyncApproved,
      actionType: syncActionType ?? actionType,
    );
  }
}

enum OutSyncType { trash, upload, etc }

class TrashSyncDecision {
  final String checksum;
  final bool? isSyncApproved;

  const TrashSyncDecision({required this.checksum, this.isSyncApproved});

  @override
  String toString() {
    return '''TrashSyncDecision {
  checksum: $checksum,
  isSyncApproved: $isSyncApproved,
}''';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is! TrashSyncDecision) return false;
    return checksum == other.checksum && isSyncApproved == other.isSyncApproved;
  }

  @override
  int get hashCode => checksum.hashCode ^ (isSyncApproved?.hashCode ?? 0);

  TrashSyncDecision copyWith({String? checksum, bool? isSyncApproved}) {
    return TrashSyncDecision(
      checksum: checksum ?? this.checksum,
      isSyncApproved: isSyncApproved ?? this.isSyncApproved,
    );
  }
}

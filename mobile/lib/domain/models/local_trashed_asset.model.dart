class LocalTrashedAsset {
  final String localId;
  final String remoteId;
  final DateTime createdAt;

  const LocalTrashedAsset({required this.localId, required this.remoteId, required this.createdAt});

  LocalTrashedAsset copyWith({String? localId, String? remoteId, DateTime? createdAt}) {
    return LocalTrashedAsset(
      localId: localId ?? this.localId,
      remoteId: remoteId ?? this.remoteId,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalTrashedAsset) return false;
    if (identical(this, other)) return true;

    return other.localId == localId && other.remoteId == remoteId && other.createdAt == createdAt;
  }

  @override
  int get hashCode {
    return localId.hashCode ^ remoteId.hashCode ^ createdAt.hashCode;
  }

  @override
  String toString() {
    return '''LocalTrashedAsset: {
  localId: $localId,
  remoteId: $remoteId,
  createdAt: $createdAt
}''';
  }
}

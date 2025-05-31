class LocalAssetHash {
  final String id;
  final String checksum;
  final DateTime updatedAt;

  const LocalAssetHash({
    required this.id,
    required this.checksum,
    required this.updatedAt,
  });

  @override
  bool operator ==(covariant LocalAssetHash other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.checksum == checksum &&
        other.updatedAt == updatedAt;
  }

  @override
  int get hashCode {
    return id.hashCode ^ checksum.hashCode ^ updatedAt.hashCode;
  }

  @override
  String toString() {
    return 'LocalAssetHash(id: $id, checksum: $checksum, updatedAt: $updatedAt)';
  }

  LocalAssetHash copyWith({
    String? id,
    String? checksum,
    DateTime? updatedAt,
  }) {
    return LocalAssetHash(
      id: id ?? this.id,
      checksum: checksum ?? this.checksum,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

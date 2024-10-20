class AlbumETag {
  final int? id;
  final int albumId;
  final int assetCount;
  final DateTime modifiedTime;

  const AlbumETag({
    this.id,
    required this.albumId,
    required this.assetCount,
    required this.modifiedTime,
  });

  factory AlbumETag.initial() {
    return AlbumETag(
      albumId: -1,
      assetCount: 0,
      modifiedTime: DateTime.now(),
    );
  }

  @override
  bool operator ==(covariant AlbumETag other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.albumId == albumId &&
        other.assetCount == assetCount &&
        other.modifiedTime == modifiedTime;
  }

  @override
  int get hashCode =>
      id.hashCode ^
      albumId.hashCode ^
      assetCount.hashCode ^
      modifiedTime.hashCode;
}

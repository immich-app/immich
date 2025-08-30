enum BackupSelection {
  // Used to sort albums based on the backupSelection
  // selected -> none -> excluded
  // Do not change the order of these values
  selected,
  none,
  excluded,
}

class LocalAlbum {
  final String id;
  final String name;
  final DateTime updatedAt;
  final bool isIosSharedAlbum;

  final int assetCount;
  final BackupSelection backupSelection;
  final String? linkedRemoteAlbumId;

  const LocalAlbum({
    required this.id,
    required this.name,
    required this.updatedAt,
    this.assetCount = 0,
    this.backupSelection = BackupSelection.none,
    this.isIosSharedAlbum = false,
    this.linkedRemoteAlbumId,
  });

  LocalAlbum copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
    String? linkedRemoteAlbumId,
  }) {
    return LocalAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      assetCount: assetCount ?? this.assetCount,
      backupSelection: backupSelection ?? this.backupSelection,
      isIosSharedAlbum: isIosSharedAlbum ?? this.isIosSharedAlbum,
      linkedRemoteAlbumId: linkedRemoteAlbumId ?? this.linkedRemoteAlbumId,
    );
  }

  @override
  bool operator ==(Object other) {
    if (other is! LocalAlbum) return false;
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.updatedAt == updatedAt &&
        other.assetCount == assetCount &&
        other.backupSelection == backupSelection &&
        other.isIosSharedAlbum == isIosSharedAlbum &&
        other.linkedRemoteAlbumId == linkedRemoteAlbumId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode ^
        backupSelection.hashCode ^
        isIosSharedAlbum.hashCode ^
        linkedRemoteAlbumId.hashCode;
  }

  @override
  String toString() {
    return '''LocalAlbum: {
id: $id,
name: $name,
updatedAt: $updatedAt,
assetCount: $assetCount,
backupSelection: $backupSelection,
isIosSharedAlbum: $isIosSharedAlbum
linkedRemoteAlbumId: $linkedRemoteAlbumId,
}''';
  }
}

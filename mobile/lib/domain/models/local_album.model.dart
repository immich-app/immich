enum BackupSelection {
  none,
  selected,
  excluded,
}

class LocalAlbum {
  final String id;
  final String name;
  final DateTime updatedAt;

  /// Whether the album contains all photos (i.e, the virtual "Recent" album)
  final bool isAll;
  final int assetCount;
  final String? thumbnailId;
  final BackupSelection backupSelection;

  const LocalAlbum({
    required this.id,
    required this.name,
    required this.updatedAt,
    this.assetCount = 0,
    this.thumbnailId,
    this.backupSelection = BackupSelection.none,
    this.isAll = false,
  });

  LocalAlbum copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    String? thumbnailId,
    BackupSelection? backupSelection,
    bool? isAll,
  }) {
    return LocalAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      assetCount: assetCount ?? this.assetCount,
      thumbnailId: thumbnailId ?? this.thumbnailId,
      backupSelection: backupSelection ?? this.backupSelection,
      isAll: isAll ?? this.isAll,
    );
  }

  @override
  bool operator ==(covariant LocalAlbum other) {
    if (identical(this, other)) return true;

    return other.id == id &&
        other.name == name &&
        other.updatedAt == updatedAt &&
        other.assetCount == assetCount &&
        other.isAll == isAll &&
        other.thumbnailId == thumbnailId &&
        other.backupSelection == backupSelection;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode ^
        isAll.hashCode ^
        thumbnailId.hashCode ^
        backupSelection.hashCode;
  }

  @override
  String toString() {
    return '''LocalAlbum: {
id: $id,
name: $name,
updatedAt: $updatedAt,
assetCount: $assetCount,
thumbnailId: ${thumbnailId ?? '<NA>'},
backupSelection: $backupSelection,
isAll: $isAll
}''';
  }
}

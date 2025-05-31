enum BackupSelection {
  none._(1),
  selected._(0),
  excluded._(2);

  // Used to sort albums based on the backupSelection
  // selected -> none -> excluded
  final int sortOrder;
  const BackupSelection._(this.sortOrder);
}

class LocalAlbum {
  final String id;
  final String name;
  final DateTime updatedAt;
  final bool isCloud;

  final int assetCount;
  final BackupSelection backupSelection;

  const LocalAlbum({
    required this.id,
    required this.name,
    required this.updatedAt,
    this.assetCount = 0,
    this.backupSelection = BackupSelection.none,
    this.isCloud = false,
  });

  LocalAlbum copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    BackupSelection? backupSelection,
    bool? isCloud,
  }) {
    return LocalAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      assetCount: assetCount ?? this.assetCount,
      backupSelection: backupSelection ?? this.backupSelection,
      isCloud: isCloud ?? this.isCloud,
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
        other.isCloud == isCloud;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode ^
        backupSelection.hashCode ^
        isCloud.hashCode;
  }

  @override
  String toString() {
    return '''LocalAlbum: {
id: $id,
name: $name,
updatedAt: $updatedAt,
assetCount: $assetCount,
backupSelection: $backupSelection,
isCloud: $isCloud
}''';
  }
}

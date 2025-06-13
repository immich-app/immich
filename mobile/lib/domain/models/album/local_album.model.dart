part of 'base_album.model.dart';

enum BackupSelection {
  // Used to sort albums based on the backupSelection
  // selected -> none -> excluded
  // Do not change the order of these values
  selected,
  none,
  excluded,
}

class LocalAlbum extends BaseAlbum {
  final bool isIosSharedAlbum;

  final BackupSelection backupSelection;

  const LocalAlbum({
    required super.id,
    required super.name,
    required super.updatedAt,
    super.assetCount = 0,
    this.backupSelection = BackupSelection.none,
    this.isIosSharedAlbum = false,
  });

  LocalAlbum copyWith({
    String? id,
    String? name,
    DateTime? updatedAt,
    int? assetCount,
    BackupSelection? backupSelection,
    bool? isIosSharedAlbum,
  }) {
    return LocalAlbum(
      id: id ?? this.id,
      name: name ?? this.name,
      updatedAt: updatedAt ?? this.updatedAt,
      assetCount: assetCount ?? this.assetCount,
      backupSelection: backupSelection ?? this.backupSelection,
      isIosSharedAlbum: isIosSharedAlbum ?? this.isIosSharedAlbum,
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
        other.isIosSharedAlbum == isIosSharedAlbum;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode ^
        backupSelection.hashCode ^
        isIosSharedAlbum.hashCode;
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
}''';
  }
}

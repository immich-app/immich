part 'album.model.dart';
part 'local_album.model.dart';

class BaseAlbum {
  final String id;
  final String name;
  final DateTime updatedAt;
  final int assetCount;

  const BaseAlbum({
    required this.id,
    required this.name,
    required this.updatedAt,
    required this.assetCount,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is BaseAlbum) {
      return id == other.id &&
          name == other.name &&
          updatedAt == other.updatedAt &&
          assetCount == other.assetCount;
    }
    return false;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        updatedAt.hashCode ^
        assetCount.hashCode;
  }
}

import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class TrashedAsset {
  final String id;
  final String name;
  final String albumId;
  final String? checksum;
  final AssetType type;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int? size;

  const TrashedAsset({
    required this.id,
    required this.name,
    required this.checksum,
    required this.albumId,
    required this.type,
    required this.createdAt,
    required this.updatedAt,
    this.size,
  });

  TrashedAsset copyWith({
    String? id,
    String? name,
    String? albumId,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? size,
  }) {
    return TrashedAsset(
      id: id ?? this.id,
      name: name ?? this.name,
      albumId: albumId ?? this.albumId,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      size: size ?? this.size,
    );
  }

  @override
  String toString() {
    return 'TrashedAsset('
        'id: $id, '
        'name: $name, '
        'albumId: $albumId, '
        'checksum: $checksum, '
        'type: $type, '
        'createdAt: $createdAt, '
        'updatedAt: $updatedAt, '
        'size: ${size ?? "<NA>"}'
        ')';
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrashedAsset &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          albumId == other.albumId &&
          checksum == other.checksum &&
          type == other.type &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          size == other.size;

  @override
  int get hashCode => Object.hash(id, name, albumId, checksum, type, createdAt, updatedAt, size);
}

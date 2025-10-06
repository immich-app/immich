import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class TrashedAsset extends LocalAsset {
  final String albumId;

  const TrashedAsset({
    required this.albumId,
    required super.id,
    super.remoteId,
    required super.name,
    super.checksum,
    required super.type,
    required super.createdAt,
    required super.updatedAt,
    super.width,
    super.height,
    super.durationInSeconds,
    super.isFavorite = false,
    super.livePhotoVideoId,
    super.orientation = 0,
  });

  @override
  TrashedAsset copyWith({
    String? id,
    String? remoteId,
    String? name,
    String? checksum,
    AssetType? type,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? width,
    int? height,
    int? durationInSeconds,
    bool? isFavorite,
    String? livePhotoVideoId,
    int? orientation,
    String? albumId,
  }) {
    return TrashedAsset(
      id: id ?? this.id,
      remoteId: remoteId ?? this.remoteId,
      name: name ?? this.name,
      checksum: checksum ?? this.checksum,
      type: type ?? this.type,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      width: width ?? this.width,
      height: height ?? this.height,
      durationInSeconds: durationInSeconds ?? this.durationInSeconds,
      isFavorite: isFavorite ?? this.isFavorite,
      livePhotoVideoId: livePhotoVideoId ?? this.livePhotoVideoId,
      orientation: orientation ?? this.orientation,
      albumId: albumId ?? this.albumId,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TrashedAsset &&
          runtimeType == other.runtimeType &&
          // LocalAsset identity
          id == other.id &&
          name == other.name &&
          remoteId == other.remoteId &&
          checksum == other.checksum &&
          type == other.type &&
          createdAt == other.createdAt &&
          updatedAt == other.updatedAt &&
          width == other.width &&
          height == other.height &&
          durationInSeconds == other.durationInSeconds &&
          isFavorite == other.isFavorite &&
          livePhotoVideoId == other.livePhotoVideoId &&
          orientation == other.orientation &&
          // TrashedAsset extras
          albumId == other.albumId;

  @override
  int get hashCode => Object.hash(
    id,
    name,
    remoteId,
    checksum,
    type,
    createdAt,
    updatedAt,
    width,
    height,
    durationInSeconds,
    isFavorite,
    livePhotoVideoId,
    orientation,
    albumId,
  );

  @override
  String toString() {
    return 'TrashedAsset('
        'id: $id, '
        'remoteId: $remoteId, '
        'name: $name, '
        'checksum: $checksum, '
        'type: $type, '
        'createdAt: $createdAt, '
        'updatedAt: $updatedAt, '
        'width: $width, '
        'height: $height, '
        'durationInSeconds: $durationInSeconds, '
        'isFavorite: $isFavorite, '
        'livePhotoVideoId: $livePhotoVideoId, '
        'orientation: $orientation, '
        'albumId: $albumId, '
        ')';
  }
}

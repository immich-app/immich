// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class UpdateAlbumDto {
  const UpdateAlbumDto({
    this.albumName = const Optional.absent(),
    this.albumThumbnailAssetId = const Optional.absent(),
    this.description = const Optional.absent(),
    this.isActivityEnabled = const Optional.absent(),
    this.order = const Optional.absent(),
  });

  /// Album name
  final Optional<String> albumName;

  /// Album thumbnail asset ID
  final Optional<String> albumThumbnailAssetId;

  /// Album description
  final Optional<String> description;

  /// Enable activity feed
  final Optional<bool> isActivityEnabled;

  final Optional<AssetOrder> order;

  static UpdateAlbumDto? fromJson(dynamic value) {
    ApiCompat.upgrade<UpdateAlbumDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumName: json.containsKey(r'albumName')
          ? Optional.present(json[r'albumName'] as String)
          : const Optional.absent(),
      albumThumbnailAssetId: json.containsKey(r'albumThumbnailAssetId')
          ? Optional.present(json[r'albumThumbnailAssetId'] as String)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present(json[r'description'] as String)
          : const Optional.absent(),
      isActivityEnabled: json.containsKey(r'isActivityEnabled')
          ? Optional.present(json[r'isActivityEnabled'] as bool)
          : const Optional.absent(),
      order: json.containsKey(r'order')
          ? Optional.present((AssetOrder.fromJson(json[r'order']))!)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (albumName case Present(:final value)) {
      json[r'albumName'] = value;
    }
    if (albumThumbnailAssetId case Present(:final value)) {
      json[r'albumThumbnailAssetId'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    if (isActivityEnabled case Present(:final value)) {
      json[r'isActivityEnabled'] = value;
    }
    if (order case Present(:final value)) {
      json[r'order'] = value.toJson();
    }
    return json;
  }

  UpdateAlbumDto copyWith({
    Optional<String>? albumName,
    Optional<String>? albumThumbnailAssetId,
    Optional<String>? description,
    Optional<bool>? isActivityEnabled,
    Optional<AssetOrder>? order,
  }) {
    return .new(
      albumName: albumName ?? this.albumName,
      albumThumbnailAssetId: albumThumbnailAssetId ?? this.albumThumbnailAssetId,
      description: description ?? this.description,
      isActivityEnabled: isActivityEnabled ?? this.isActivityEnabled,
      order: order ?? this.order,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is UpdateAlbumDto &&
            albumName == other.albumName &&
            albumThumbnailAssetId == other.albumThumbnailAssetId &&
            description == other.description &&
            isActivityEnabled == other.isActivityEnabled &&
            order == other.order);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumName, albumThumbnailAssetId, description, isActivityEnabled, order]);
  }

  @override
  String toString() =>
      'UpdateAlbumDto(albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, description=$description, isActivityEnabled=$isActivityEnabled, order=$order)';
}

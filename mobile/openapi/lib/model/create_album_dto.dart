// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class CreateAlbumDto {
  const CreateAlbumDto({
    required this.albumName,
    this.albumUsers = const Optional.absent(),
    this.assetIds = const Optional.absent(),
    this.description = const Optional.absent(),
  });

  /// Album name
  final String albumName;

  /// Album users
  final Optional<List<AlbumUserCreateDto>> albumUsers;

  /// Initial asset IDs
  final Optional<List<String>> assetIds;

  /// Album description
  final Optional<String> description;

  static CreateAlbumDto? fromJson(dynamic value) {
    ApiCompat.upgrade<CreateAlbumDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumName: json[r'albumName'] as String,
      albumUsers: json.containsKey(r'albumUsers')
          ? Optional.present(
              ((json[r'albumUsers'] as List?)
                  ?.map(($e) => (AlbumUserCreateDto.fromJson($e))!)
                  .toList(growable: false))!,
            )
          : const Optional.absent(),
      assetIds: json.containsKey(r'assetIds')
          ? Optional.present(((json[r'assetIds'] as List?)?.map(($e) => $e as String).toList(growable: false))!)
          : const Optional.absent(),
      description: json.containsKey(r'description')
          ? Optional.present(json[r'description'] as String)
          : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumName'] = albumName;
    if (albumUsers case Present(:final value)) {
      json[r'albumUsers'] = value.map(($e) => $e.toJson()).toList(growable: false);
    }
    if (assetIds case Present(:final value)) {
      json[r'assetIds'] = value;
    }
    if (description case Present(:final value)) {
      json[r'description'] = value;
    }
    return json;
  }

  CreateAlbumDto copyWith({
    String? albumName,
    Optional<List<AlbumUserCreateDto>>? albumUsers,
    Optional<List<String>>? assetIds,
    Optional<String>? description,
  }) {
    return .new(
      albumName: albumName ?? this.albumName,
      albumUsers: albumUsers ?? this.albumUsers,
      assetIds: assetIds ?? this.assetIds,
      description: description ?? this.description,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is CreateAlbumDto &&
            albumName == other.albumName &&
            albumUsers == other.albumUsers &&
            assetIds == other.assetIds &&
            description == other.description);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumName, albumUsers, assetIds, description]);
  }

  @override
  String toString() =>
      'CreateAlbumDto(albumName=$albumName, albumUsers=$albumUsers, assetIds=$assetIds, description=$description)';
}

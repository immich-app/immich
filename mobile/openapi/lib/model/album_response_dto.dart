//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumResponseDto {
  /// Returns a new [AlbumResponseDto] instance.
  AlbumResponseDto({
    required this.assetCount,
    required this.id,
    required this.ownerId,
    required this.albumName,
    required this.createdAt,
    required this.albumThumbnailAssetId,
    required this.shared,
    this.sharedUsers = const [],
    this.assets = const [],
  });

  int assetCount;

  String id;

  String ownerId;

  String albumName;

  String createdAt;

  String? albumThumbnailAssetId;

  bool shared;

  List<UserResponseDto> sharedUsers;

  List<AssetResponseDto> assets;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AlbumResponseDto &&
          other.assetCount == assetCount &&
          other.id == id &&
          other.ownerId == ownerId &&
          other.albumName == albumName &&
          other.createdAt == createdAt &&
          other.albumThumbnailAssetId == albumThumbnailAssetId &&
          other.shared == shared &&
          other.sharedUsers == sharedUsers &&
          other.assets == assets;

  @override
  int get hashCode =>
      // ignore: unnecessary_parenthesis
      (assetCount.hashCode) +
      (id.hashCode) +
      (ownerId.hashCode) +
      (albumName.hashCode) +
      (createdAt.hashCode) +
      (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
      (shared.hashCode) +
      (sharedUsers.hashCode) +
      (assets.hashCode);

  @override
  String toString() =>
      'AlbumResponseDto[assetCount=$assetCount, id=$id, ownerId=$ownerId, albumName=$albumName, createdAt=$createdAt, albumThumbnailAssetId=$albumThumbnailAssetId, shared=$shared, sharedUsers=$sharedUsers, assets=$assets]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    _json[r'assetCount'] = assetCount;
    _json[r'id'] = id;
    _json[r'ownerId'] = ownerId;
    _json[r'albumName'] = albumName;
    _json[r'createdAt'] = createdAt;
    if (albumThumbnailAssetId != null) {
      _json[r'albumThumbnailAssetId'] = albumThumbnailAssetId;
    } else {
      _json[r'albumThumbnailAssetId'] = null;
    }
    _json[r'shared'] = shared;
    _json[r'sharedUsers'] = sharedUsers;
    _json[r'assets'] = assets;
    return _json;
  }

  /// Returns a new [AlbumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      // assert(() {
      //   requiredKeys.forEach((key) {
      //     assert(json.containsKey(key), 'Required key "AlbumResponseDto[$key]" is missing from JSON.');
      //     assert(json[key] != null, 'Required key "AlbumResponseDto[$key]" has a null value in JSON.');
      //   });
      //   return true;
      // }());

      return AlbumResponseDto(
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        id: mapValueOfType<String>(json, r'id')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        albumName: mapValueOfType<String>(json, r'albumName')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        albumThumbnailAssetId:
            mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        shared: mapValueOfType<bool>(json, r'shared')!,
        sharedUsers: UserResponseDto.listFromJson(json[r'sharedUsers'])!,
        assets: AssetResponseDto.listFromJson(json[r'assets'])!,
      );
    }
    return null;
  }

  static List<AlbumResponseDto>? listFromJson(
    dynamic json, {
    bool growable = false,
  }) {
    final result = <AlbumResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumResponseDto-objects as value to a dart map
  static Map<String, List<AlbumResponseDto>> mapListFromJson(
    dynamic json, {
    bool growable = false,
  }) {
    final map = <String, List<AlbumResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumResponseDto.listFromJson(
          entry.value,
          growable: growable,
        );
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetCount',
    'id',
    'ownerId',
    'albumName',
    'createdAt',
    'albumThumbnailAssetId',
    'shared',
    'sharedUsers',
    'assets',
  };
}

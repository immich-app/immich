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
    required this.updatedAt,
    required this.albumThumbnailAssetId,
    required this.shared,
    this.sharedUsers = const [],
    this.assets = const [],
    required this.owner,
  });

  int assetCount;

  String id;

  String ownerId;

  String albumName;

  DateTime createdAt;

  DateTime updatedAt;

  String? albumThumbnailAssetId;

  bool shared;

  List<UserResponseDto> sharedUsers;

  List<AssetResponseDto> assets;

  UserResponseDto owner;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumResponseDto &&
     other.assetCount == assetCount &&
     other.id == id &&
     other.ownerId == ownerId &&
     other.albumName == albumName &&
     other.createdAt == createdAt &&
     other.updatedAt == updatedAt &&
     other.albumThumbnailAssetId == albumThumbnailAssetId &&
     other.shared == shared &&
     other.sharedUsers == sharedUsers &&
     other.assets == assets &&
     other.owner == owner;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetCount.hashCode) +
    (id.hashCode) +
    (ownerId.hashCode) +
    (albumName.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (shared.hashCode) +
    (sharedUsers.hashCode) +
    (assets.hashCode) +
    (owner.hashCode);

  @override
  String toString() => 'AlbumResponseDto[assetCount=$assetCount, id=$id, ownerId=$ownerId, albumName=$albumName, createdAt=$createdAt, updatedAt=$updatedAt, albumThumbnailAssetId=$albumThumbnailAssetId, shared=$shared, sharedUsers=$sharedUsers, assets=$assets, owner=$owner]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetCount'] = this.assetCount;
      json[r'id'] = this.id;
      json[r'ownerId'] = this.ownerId;
      json[r'albumName'] = this.albumName;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
      // json[r'albumThumbnailAssetId'] = null;
    }
      json[r'shared'] = this.shared;
      json[r'sharedUsers'] = this.sharedUsers;
      json[r'assets'] = this.assets;
      json[r'owner'] = this.owner;
    return json;
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
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AlbumResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AlbumResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AlbumResponseDto(
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        id: mapValueOfType<String>(json, r'id')!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        albumName: mapValueOfType<String>(json, r'albumName')!,
        createdAt: mapDateTime(json, r'createdAt', '')!,
        updatedAt: mapDateTime(json, r'updatedAt', '')!,
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        shared: mapValueOfType<bool>(json, r'shared')!,
        sharedUsers: UserResponseDto.listFromJson(json[r'sharedUsers']),
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        owner: UserResponseDto.fromJson(json[r'owner'])!,
      );
    }
    return null;
  }

  static List<AlbumResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
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
  static Map<String, List<AlbumResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumResponseDto.listFromJson(entry.value, growable: growable,);
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
    'updatedAt',
    'albumThumbnailAssetId',
    'shared',
    'sharedUsers',
    'assets',
    'owner',
  };
}


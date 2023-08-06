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
    required this.albumName,
    required this.albumThumbnailAssetId,
    required this.assetCount,
    this.assets = const [],
    required this.createdAt,
    required this.description,
    required this.id,
    this.lastModifiedAssetTimestamp,
    required this.owner,
    required this.ownerId,
    required this.shared,
    this.sharedUsers = const [],
    required this.updatedAt,
  });

  String albumName;

  String? albumThumbnailAssetId;

  int assetCount;

  List<AssetResponseDto> assets;

  DateTime createdAt;

  String description;

  String id;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastModifiedAssetTimestamp;

  UserResponseDto owner;

  String ownerId;

  bool shared;

  List<UserResponseDto> sharedUsers;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumResponseDto &&
    other.albumName == albumName &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    other.assetCount == assetCount &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.id == id &&
    other.lastModifiedAssetTimestamp == lastModifiedAssetTimestamp &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    other.shared == shared &&
    _deepEquality.equals(other.sharedUsers, sharedUsers) &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (assetCount.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (description.hashCode) +
    (id.hashCode) +
    (lastModifiedAssetTimestamp == null ? 0 : lastModifiedAssetTimestamp!.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (shared.hashCode) +
    (sharedUsers.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AlbumResponseDto[albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, assetCount=$assetCount, assets=$assets, createdAt=$createdAt, description=$description, id=$id, lastModifiedAssetTimestamp=$lastModifiedAssetTimestamp, owner=$owner, ownerId=$ownerId, shared=$shared, sharedUsers=$sharedUsers, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumName'] = this.albumName;
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
      json[r'assetCount'] = this.assetCount;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'description'] = this.description;
      json[r'id'] = this.id;
    if (this.lastModifiedAssetTimestamp != null) {
      json[r'lastModifiedAssetTimestamp'] = this.lastModifiedAssetTimestamp!.toUtc().toIso8601String();
    } else {
    //  json[r'lastModifiedAssetTimestamp'] = null;
    }
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'shared'] = this.shared;
      json[r'sharedUsers'] = this.sharedUsers;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AlbumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumResponseDto(
        albumName: mapValueOfType<String>(json, r'albumName')!,
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description')!,
        id: mapValueOfType<String>(json, r'id')!,
        lastModifiedAssetTimestamp: mapDateTime(json, r'lastModifiedAssetTimestamp', r''),
        owner: UserResponseDto.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        shared: mapValueOfType<bool>(json, r'shared')!,
        sharedUsers: UserResponseDto.listFromJson(json[r'sharedUsers']),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
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
    'albumName',
    'albumThumbnailAssetId',
    'assetCount',
    'assets',
    'createdAt',
    'description',
    'id',
    'owner',
    'ownerId',
    'shared',
    'sharedUsers',
    'updatedAt',
  };
}


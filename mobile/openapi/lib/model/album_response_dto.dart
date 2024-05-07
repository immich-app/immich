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
    this.albumUsers = const [],
    required this.assetCount,
    this.assets = const [],
    required this.createdAt,
    required this.description,
    this.endDate,
    required this.hasSharedLink,
    required this.id,
    required this.isActivityEnabled,
    this.lastModifiedAssetTimestamp,
    this.order,
    required this.owner,
    required this.ownerId,
    required this.shared,
    this.sharedUsers = const [],
    this.startDate,
    required this.updatedAt,
  });

  String albumName;

  String? albumThumbnailAssetId;

  List<AlbumUserResponseDto> albumUsers;

  int assetCount;

  List<AssetResponseDto> assets;

  DateTime createdAt;

  String description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? endDate;

  bool hasSharedLink;

  String id;

  bool isActivityEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastModifiedAssetTimestamp;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetOrder? order;

  UserResponseDto owner;

  String ownerId;

  bool shared;

  /// This property was deprecated in v1.102.0
  List<UserResponseDto> sharedUsers;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? startDate;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumResponseDto &&
    other.albumName == albumName &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    _deepEquality.equals(other.albumUsers, albumUsers) &&
    other.assetCount == assetCount &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.endDate == endDate &&
    other.hasSharedLink == hasSharedLink &&
    other.id == id &&
    other.isActivityEnabled == isActivityEnabled &&
    other.lastModifiedAssetTimestamp == lastModifiedAssetTimestamp &&
    other.order == order &&
    other.owner == owner &&
    other.ownerId == ownerId &&
    other.shared == shared &&
    _deepEquality.equals(other.sharedUsers, sharedUsers) &&
    other.startDate == startDate &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (albumUsers.hashCode) +
    (assetCount.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (description.hashCode) +
    (endDate == null ? 0 : endDate!.hashCode) +
    (hasSharedLink.hashCode) +
    (id.hashCode) +
    (isActivityEnabled.hashCode) +
    (lastModifiedAssetTimestamp == null ? 0 : lastModifiedAssetTimestamp!.hashCode) +
    (order == null ? 0 : order!.hashCode) +
    (owner.hashCode) +
    (ownerId.hashCode) +
    (shared.hashCode) +
    (sharedUsers.hashCode) +
    (startDate == null ? 0 : startDate!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AlbumResponseDto[albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, albumUsers=$albumUsers, assetCount=$assetCount, assets=$assets, createdAt=$createdAt, description=$description, endDate=$endDate, hasSharedLink=$hasSharedLink, id=$id, isActivityEnabled=$isActivityEnabled, lastModifiedAssetTimestamp=$lastModifiedAssetTimestamp, order=$order, owner=$owner, ownerId=$ownerId, shared=$shared, sharedUsers=$sharedUsers, startDate=$startDate, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumName'] = this.albumName;
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
      json[r'albumUsers'] = this.albumUsers;
      json[r'assetCount'] = this.assetCount;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'description'] = this.description;
    if (this.endDate != null) {
      json[r'endDate'] = this.endDate!.toUtc().toIso8601String();
    } else {
    //  json[r'endDate'] = null;
    }
      json[r'hasSharedLink'] = this.hasSharedLink;
      json[r'id'] = this.id;
      json[r'isActivityEnabled'] = this.isActivityEnabled;
    if (this.lastModifiedAssetTimestamp != null) {
      json[r'lastModifiedAssetTimestamp'] = this.lastModifiedAssetTimestamp!.toUtc().toIso8601String();
    } else {
    //  json[r'lastModifiedAssetTimestamp'] = null;
    }
    if (this.order != null) {
      json[r'order'] = this.order;
    } else {
    //  json[r'order'] = null;
    }
      json[r'owner'] = this.owner;
      json[r'ownerId'] = this.ownerId;
      json[r'shared'] = this.shared;
      json[r'sharedUsers'] = this.sharedUsers;
    if (this.startDate != null) {
      json[r'startDate'] = this.startDate!.toUtc().toIso8601String();
    } else {
    //  json[r'startDate'] = null;
    }
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
        albumUsers: AlbumUserResponseDto.listFromJson(json[r'albumUsers']),
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        description: mapValueOfType<String>(json, r'description')!,
        endDate: mapDateTime(json, r'endDate', r''),
        hasSharedLink: mapValueOfType<bool>(json, r'hasSharedLink')!,
        id: mapValueOfType<String>(json, r'id')!,
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled')!,
        lastModifiedAssetTimestamp: mapDateTime(json, r'lastModifiedAssetTimestamp', r''),
        order: AssetOrder.fromJson(json[r'order']),
        owner: UserResponseDto.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        shared: mapValueOfType<bool>(json, r'shared')!,
        sharedUsers: UserResponseDto.listFromJson(json[r'sharedUsers']),
        startDate: mapDateTime(json, r'startDate', r''),
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
    'albumUsers',
    'assetCount',
    'assets',
    'createdAt',
    'description',
    'hasSharedLink',
    'id',
    'isActivityEnabled',
    'owner',
    'ownerId',
    'shared',
    'sharedUsers',
    'updatedAt',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

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
    this.contributorCounts = const [],
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
    this.startDate,
    required this.updatedAt,
  });

  /// Album name
  String albumName;

  /// Thumbnail asset ID
  String? albumThumbnailAssetId;

  List<AlbumUserResponseDto> albumUsers;

  /// Number of assets
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int assetCount;

  List<AssetResponseDto> assets;

  List<ContributorCountResponseDto> contributorCounts;

  /// Creation date
  DateTime createdAt;

  /// Album description
  String description;

  /// End date (latest asset)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? endDate;

  /// Has shared link
  bool hasSharedLink;

  /// Album ID
  String id;

  /// Activity feed enabled
  bool isActivityEnabled;

  /// Last modified asset timestamp
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? lastModifiedAssetTimestamp;

  /// Asset sort order
  AlbumResponseDtoOrderEnum? order;

  UserResponseDto owner;

  /// Owner user ID
  String ownerId;

  /// Is shared album
  bool shared;

  /// Start date (earliest asset)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? startDate;

  /// Last update date
  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumResponseDto &&
    other.albumName == albumName &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    _deepEquality.equals(other.albumUsers, albumUsers) &&
    other.assetCount == assetCount &&
    _deepEquality.equals(other.assets, assets) &&
    _deepEquality.equals(other.contributorCounts, contributorCounts) &&
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
    (contributorCounts.hashCode) +
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
    (startDate == null ? 0 : startDate!.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'AlbumResponseDto[albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, albumUsers=$albumUsers, assetCount=$assetCount, assets=$assets, contributorCounts=$contributorCounts, createdAt=$createdAt, description=$description, endDate=$endDate, hasSharedLink=$hasSharedLink, id=$id, isActivityEnabled=$isActivityEnabled, lastModifiedAssetTimestamp=$lastModifiedAssetTimestamp, order=$order, owner=$owner, ownerId=$ownerId, shared=$shared, startDate=$startDate, updatedAt=$updatedAt]';

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
      json[r'contributorCounts'] = this.contributorCounts;
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
      json[r'description'] = this.description;
    if (this.endDate != null) {
      json[r'endDate'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.endDate!.millisecondsSinceEpoch
        : this.endDate!.toUtc().toIso8601String();
    } else {
    //  json[r'endDate'] = null;
    }
      json[r'hasSharedLink'] = this.hasSharedLink;
      json[r'id'] = this.id;
      json[r'isActivityEnabled'] = this.isActivityEnabled;
    if (this.lastModifiedAssetTimestamp != null) {
      json[r'lastModifiedAssetTimestamp'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.lastModifiedAssetTimestamp!.millisecondsSinceEpoch
        : this.lastModifiedAssetTimestamp!.toUtc().toIso8601String();
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
    if (this.startDate != null) {
      json[r'startDate'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.startDate!.millisecondsSinceEpoch
        : this.startDate!.toUtc().toIso8601String();
    } else {
    //  json[r'startDate'] = null;
    }
      json[r'updatedAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.updatedAt.millisecondsSinceEpoch
        : this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [AlbumResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumResponseDto(
        albumName: mapValueOfType<String>(json, r'albumName')!,
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        albumUsers: AlbumUserResponseDto.listFromJson(json[r'albumUsers']),
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        contributorCounts: ContributorCountResponseDto.listFromJson(json[r'contributorCounts']),
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        description: mapValueOfType<String>(json, r'description')!,
        endDate: mapDateTime(json, r'endDate', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        hasSharedLink: mapValueOfType<bool>(json, r'hasSharedLink')!,
        id: mapValueOfType<String>(json, r'id')!,
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled')!,
        lastModifiedAssetTimestamp: mapDateTime(json, r'lastModifiedAssetTimestamp', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        order: AlbumResponseDtoOrderEnum.fromJson(json[r'order']),
        owner: UserResponseDto.fromJson(json[r'owner'])!,
        ownerId: mapValueOfType<String>(json, r'ownerId')!,
        shared: mapValueOfType<bool>(json, r'shared')!,
        startDate: mapDateTime(json, r'startDate', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        updatedAt: mapDateTime(json, r'updatedAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
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
    'updatedAt',
  };
}

/// Asset sort order
class AlbumResponseDtoOrderEnum {
  /// Instantiate a new enum with the provided [value].
  const AlbumResponseDtoOrderEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const asc = AlbumResponseDtoOrderEnum._(r'asc');
  static const desc = AlbumResponseDtoOrderEnum._(r'desc');

  /// List of all possible values in this [enum][AlbumResponseDtoOrderEnum].
  static const values = <AlbumResponseDtoOrderEnum>[
    asc,
    desc,
  ];

  static AlbumResponseDtoOrderEnum? fromJson(dynamic value) => AlbumResponseDtoOrderEnumTypeTransformer().decode(value);

  static List<AlbumResponseDtoOrderEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumResponseDtoOrderEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumResponseDtoOrderEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [AlbumResponseDtoOrderEnum] to String,
/// and [decode] dynamic data back to [AlbumResponseDtoOrderEnum].
class AlbumResponseDtoOrderEnumTypeTransformer {
  factory AlbumResponseDtoOrderEnumTypeTransformer() => _instance ??= const AlbumResponseDtoOrderEnumTypeTransformer._();

  const AlbumResponseDtoOrderEnumTypeTransformer._();

  String encode(AlbumResponseDtoOrderEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a AlbumResponseDtoOrderEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  AlbumResponseDtoOrderEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'asc': return AlbumResponseDtoOrderEnum.asc;
        case r'desc': return AlbumResponseDtoOrderEnum.desc;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [AlbumResponseDtoOrderEnumTypeTransformer] instance.
  static AlbumResponseDtoOrderEnumTypeTransformer? _instance;
}



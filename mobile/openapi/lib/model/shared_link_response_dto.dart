//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedLinkResponseDto {
  /// Returns a new [SharedLinkResponseDto] instance.
  SharedLinkResponseDto({
    this.album,
    required this.allowDownload,
    required this.allowUpload,
    this.assets = const [],
    required this.createdAt,
    required this.description,
    required this.expiresAt,
    required this.id,
    required this.key,
    required this.password,
    required this.showMetadata,
    required this.slug,
    this.token,
    required this.type,
    required this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumResponseDto? album;

  /// Allow downloads
  bool allowDownload;

  /// Allow uploads
  bool allowUpload;

  List<AssetResponseDto> assets;

  /// Creation date
  DateTime createdAt;

  String? description;

  DateTime? expiresAt;

  /// Shared link ID
  String id;

  /// Encryption key (base64url)
  String key;

  String? password;

  /// Show metadata
  bool showMetadata;

  String? slug;

  String? token;

  /// Shared link type
  SharedLinkResponseDtoTypeEnum type;

  /// Owner user ID
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedLinkResponseDto &&
    other.album == album &&
    other.allowDownload == allowDownload &&
    other.allowUpload == allowUpload &&
    _deepEquality.equals(other.assets, assets) &&
    other.createdAt == createdAt &&
    other.description == description &&
    other.expiresAt == expiresAt &&
    other.id == id &&
    other.key == key &&
    other.password == password &&
    other.showMetadata == showMetadata &&
    other.slug == slug &&
    other.token == token &&
    other.type == type &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (album == null ? 0 : album!.hashCode) +
    (allowDownload.hashCode) +
    (allowUpload.hashCode) +
    (assets.hashCode) +
    (createdAt.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (id.hashCode) +
    (key.hashCode) +
    (password == null ? 0 : password!.hashCode) +
    (showMetadata.hashCode) +
    (slug == null ? 0 : slug!.hashCode) +
    (token == null ? 0 : token!.hashCode) +
    (type.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SharedLinkResponseDto[album=$album, allowDownload=$allowDownload, allowUpload=$allowUpload, assets=$assets, createdAt=$createdAt, description=$description, expiresAt=$expiresAt, id=$id, key=$key, password=$password, showMetadata=$showMetadata, slug=$slug, token=$token, type=$type, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.album != null) {
      json[r'album'] = this.album;
    } else {
    //  json[r'album'] = null;
    }
      json[r'allowDownload'] = this.allowDownload;
      json[r'allowUpload'] = this.allowUpload;
      json[r'assets'] = this.assets;
      json[r'createdAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.createdAt.millisecondsSinceEpoch
        : this.createdAt.toUtc().toIso8601String();
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.expiresAt!.millisecondsSinceEpoch
        : this.expiresAt!.toUtc().toIso8601String();
    } else {
    //  json[r'expiresAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'key'] = this.key;
    if (this.password != null) {
      json[r'password'] = this.password;
    } else {
    //  json[r'password'] = null;
    }
      json[r'showMetadata'] = this.showMetadata;
    if (this.slug != null) {
      json[r'slug'] = this.slug;
    } else {
    //  json[r'slug'] = null;
    }
    if (this.token != null) {
      json[r'token'] = this.token;
    } else {
    //  json[r'token'] = null;
    }
      json[r'type'] = this.type;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [SharedLinkResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedLinkResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedLinkResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedLinkResponseDto(
        album: AlbumResponseDto.fromJson(json[r'album']),
        allowDownload: mapValueOfType<bool>(json, r'allowDownload')!,
        allowUpload: mapValueOfType<bool>(json, r'allowUpload')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
        createdAt: mapDateTime(json, r'createdAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')!,
        description: mapValueOfType<String>(json, r'description'),
        expiresAt: mapDateTime(json, r'expiresAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
        id: mapValueOfType<String>(json, r'id')!,
        key: mapValueOfType<String>(json, r'key')!,
        password: mapValueOfType<String>(json, r'password'),
        showMetadata: mapValueOfType<bool>(json, r'showMetadata')!,
        slug: mapValueOfType<String>(json, r'slug'),
        token: mapValueOfType<String>(json, r'token'),
        type: SharedLinkResponseDtoTypeEnum.fromJson(json[r'type'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<SharedLinkResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedLinkResponseDto> mapFromJson(dynamic json) {
    final map = <String, SharedLinkResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedLinkResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedLinkResponseDto-objects as value to a dart map
  static Map<String, List<SharedLinkResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedLinkResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedLinkResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'allowDownload',
    'allowUpload',
    'assets',
    'createdAt',
    'description',
    'expiresAt',
    'id',
    'key',
    'password',
    'showMetadata',
    'slug',
    'type',
    'userId',
  };
}

/// Shared link type
class SharedLinkResponseDtoTypeEnum {
  /// Instantiate a new enum with the provided [value].
  const SharedLinkResponseDtoTypeEnum._(this.value);

  /// The underlying value of this enum member.
  final String value;

  @override
  String toString() => value;

  String toJson() => value;

  static const ALBUM = SharedLinkResponseDtoTypeEnum._(r'ALBUM');
  static const INDIVIDUAL = SharedLinkResponseDtoTypeEnum._(r'INDIVIDUAL');

  /// List of all possible values in this [enum][SharedLinkResponseDtoTypeEnum].
  static const values = <SharedLinkResponseDtoTypeEnum>[
    ALBUM,
    INDIVIDUAL,
  ];

  static SharedLinkResponseDtoTypeEnum? fromJson(dynamic value) => SharedLinkResponseDtoTypeEnumTypeTransformer().decode(value);

  static List<SharedLinkResponseDtoTypeEnum> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedLinkResponseDtoTypeEnum>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedLinkResponseDtoTypeEnum.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }
}

/// Transformation class that can [encode] an instance of [SharedLinkResponseDtoTypeEnum] to String,
/// and [decode] dynamic data back to [SharedLinkResponseDtoTypeEnum].
class SharedLinkResponseDtoTypeEnumTypeTransformer {
  factory SharedLinkResponseDtoTypeEnumTypeTransformer() => _instance ??= const SharedLinkResponseDtoTypeEnumTypeTransformer._();

  const SharedLinkResponseDtoTypeEnumTypeTransformer._();

  String encode(SharedLinkResponseDtoTypeEnum data) => data.value;

  /// Decodes a [dynamic value][data] to a SharedLinkResponseDtoTypeEnum.
  ///
  /// If [allowNull] is true and the [dynamic value][data] cannot be decoded successfully,
  /// then null is returned. However, if [allowNull] is false and the [dynamic value][data]
  /// cannot be decoded successfully, then an [UnimplementedError] is thrown.
  ///
  /// The [allowNull] is very handy when an API changes and a new enum value is added or removed,
  /// and users are still using an old app with the old code.
  SharedLinkResponseDtoTypeEnum? decode(dynamic data, {bool allowNull = true}) {
    if (data != null) {
      switch (data) {
        case r'ALBUM': return SharedLinkResponseDtoTypeEnum.ALBUM;
        case r'INDIVIDUAL': return SharedLinkResponseDtoTypeEnum.INDIVIDUAL;
        default:
          if (!allowNull) {
            throw ArgumentError('Unknown enum value to decode: $data');
          }
      }
    }
    return null;
  }

  /// Singleton [SharedLinkResponseDtoTypeEnumTypeTransformer] instance.
  static SharedLinkResponseDtoTypeEnumTypeTransformer? _instance;
}



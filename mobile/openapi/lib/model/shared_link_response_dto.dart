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
    this.description = const None(),
    this.expiresAt = const None(),
    required this.id,
    required this.key,
    this.password = const None(),
    required this.showMetadata,
    this.token = const None(),
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

  bool allowDownload;

  bool allowUpload;

  List<AssetResponseDto> assets;

  DateTime createdAt;

  Option<String> description;

  Option<DateTime> expiresAt;

  String id;

  String key;

  Option<String> password;

  bool showMetadata;

  Option<String> token;

  SharedLinkType type;

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
    (description.hashCode) +
    (expiresAt.hashCode) +
    (id.hashCode) +
    (key.hashCode) +
    (password.hashCode) +
    (showMetadata.hashCode) +
    (token.hashCode) +
    (type.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'SharedLinkResponseDto[album=$album, allowDownload=$allowDownload, allowUpload=$allowUpload, assets=$assets, createdAt=$createdAt, description=$description, expiresAt=$expiresAt, id=$id, key=$key, password=$password, showMetadata=$showMetadata, token=$token, type=$type, userId=$userId]';

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
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
    if (this.description.unwrapOrNull() != null) {
      json[r'description'] = this.description;
    } else {
      if(this.description.isSome) {
        json[r'description'] = null;
      }
    }
    if (this.expiresAt.unwrapOrNull() != null) {
      json[r'expiresAt'] = this.expiresAt.unwrap().toUtc().toIso8601String();
    } else {
      if(this.expiresAt.isSome) {
        json[r'expiresAt'] = null;
      }
    }
      json[r'id'] = this.id;
      json[r'key'] = this.key;
    if (this.password.unwrapOrNull() != null) {
      json[r'password'] = this.password;
    } else {
      if(this.password.isSome) {
        json[r'password'] = null;
      }
    }
      json[r'showMetadata'] = this.showMetadata;
    if (this.token.unwrapOrNull() != null) {
      json[r'token'] = this.token;
    } else {
      if(this.token.isSome) {
        json[r'token'] = null;
      }
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
        createdAt:  mapDateTime(json, r'createdAt', r'')!,
        description: Option.from(mapValueOfType<String>(json, r'description')),
        expiresAt:  Option.from(mapDateTime(json, r'expiresAt', r'')),
        id: mapValueOfType<String>(json, r'id')!,
        key: mapValueOfType<String>(json, r'key')!,
        password: Option.from(mapValueOfType<String>(json, r'password')),
        showMetadata: mapValueOfType<bool>(json, r'showMetadata')!,
        token: Option.from(mapValueOfType<String>(json, r'token')),
        type: SharedLinkType.fromJson(json[r'type'])!,
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
    'type',
    'userId',
  };
}


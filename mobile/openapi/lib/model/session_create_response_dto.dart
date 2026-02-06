//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SessionCreateResponseDto {
  /// Returns a new [SessionCreateResponseDto] instance.
  SessionCreateResponseDto({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    this.expiresAt,
    required this.current,
    required this.deviceType,
    required this.deviceOS,
    required this.appVersion,
    required this.isPendingSyncReset,
    required this.token,
  });

  /// Session ID
  String id;

  /// Creation date
  String createdAt;

  /// Last update date
  String updatedAt;

  /// Expiration date
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? expiresAt;

  /// Is current session
  bool current;

  /// Device type
  String deviceType;

  /// Device OS
  String deviceOS;

  /// App version
  String? appVersion;

  /// Is pending sync reset
  bool isPendingSyncReset;

  /// Session token
  String token;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SessionCreateResponseDto &&
    other.id == id &&
    other.createdAt == createdAt &&
    other.updatedAt == updatedAt &&
    other.expiresAt == expiresAt &&
    other.current == current &&
    other.deviceType == deviceType &&
    other.deviceOS == deviceOS &&
    other.appVersion == appVersion &&
    other.isPendingSyncReset == isPendingSyncReset &&
    other.token == token;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (current.hashCode) +
    (deviceType.hashCode) +
    (deviceOS.hashCode) +
    (appVersion == null ? 0 : appVersion!.hashCode) +
    (isPendingSyncReset.hashCode) +
    (token.hashCode);

  @override
  String toString() => 'SessionCreateResponseDto[id=$id, createdAt=$createdAt, updatedAt=$updatedAt, expiresAt=$expiresAt, current=$current, deviceType=$deviceType, deviceOS=$deviceOS, appVersion=$appVersion, isPendingSyncReset=$isPendingSyncReset, token=$token]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'createdAt'] = this.createdAt;
      json[r'updatedAt'] = this.updatedAt;
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt;
    } else {
    //  json[r'expiresAt'] = null;
    }
      json[r'current'] = this.current;
      json[r'deviceType'] = this.deviceType;
      json[r'deviceOS'] = this.deviceOS;
    if (this.appVersion != null) {
      json[r'appVersion'] = this.appVersion;
    } else {
    //  json[r'appVersion'] = null;
    }
      json[r'isPendingSyncReset'] = this.isPendingSyncReset;
      json[r'token'] = this.token;
    return json;
  }

  /// Returns a new [SessionCreateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SessionCreateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "SessionCreateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SessionCreateResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
        expiresAt: mapValueOfType<String>(json, r'expiresAt'),
        current: mapValueOfType<bool>(json, r'current')!,
        deviceType: mapValueOfType<String>(json, r'deviceType')!,
        deviceOS: mapValueOfType<String>(json, r'deviceOS')!,
        appVersion: mapValueOfType<String>(json, r'appVersion'),
        isPendingSyncReset: mapValueOfType<bool>(json, r'isPendingSyncReset')!,
        token: mapValueOfType<String>(json, r'token')!,
      );
    }
    return null;
  }

  static List<SessionCreateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SessionCreateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SessionCreateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SessionCreateResponseDto> mapFromJson(dynamic json) {
    final map = <String, SessionCreateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SessionCreateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SessionCreateResponseDto-objects as value to a dart map
  static Map<String, List<SessionCreateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SessionCreateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SessionCreateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'createdAt',
    'updatedAt',
    'current',
    'deviceType',
    'deviceOS',
    'appVersion',
    'isPendingSyncReset',
    'token',
  };
}


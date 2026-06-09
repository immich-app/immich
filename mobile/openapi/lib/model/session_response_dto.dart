//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SessionResponseDto {
  /// Returns a new [SessionResponseDto] instance.
  SessionResponseDto({
    required this.appVersion,
    required this.createdAt,
    required this.current,
    this.deviceOS,
    this.deviceType,
    this.expiresAt,
    required this.id,
    required this.isPendingSyncReset,
    required this.updatedAt,
  });

  /// App version
  String? appVersion;

  /// Creation date
  String createdAt;

  /// Is current session
  bool current;

  /// Device OS
  String? deviceOS;

  /// Device type
  String? deviceType;

  /// Expiration date
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? expiresAt;

  /// Session ID
  String id;

  /// Is pending sync reset
  bool isPendingSyncReset;

  /// Last update date
  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SessionResponseDto &&
    other.appVersion == appVersion &&
    other.createdAt == createdAt &&
    other.current == current &&
    other.deviceOS == deviceOS &&
    other.deviceType == deviceType &&
    other.expiresAt == expiresAt &&
    other.id == id &&
    other.isPendingSyncReset == isPendingSyncReset &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (appVersion == null ? 0 : appVersion!.hashCode) +
    (createdAt.hashCode) +
    (current.hashCode) +
    (deviceOS == null ? 0 : deviceOS!.hashCode) +
    (deviceType == null ? 0 : deviceType!.hashCode) +
    (expiresAt == null ? 0 : expiresAt!.hashCode) +
    (id.hashCode) +
    (isPendingSyncReset.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'SessionResponseDto[appVersion=$appVersion, createdAt=$createdAt, current=$current, deviceOS=$deviceOS, deviceType=$deviceType, expiresAt=$expiresAt, id=$id, isPendingSyncReset=$isPendingSyncReset, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.appVersion != null) {
      json[r'appVersion'] = this.appVersion;
    } else {
      json[r'appVersion'] = null;
    }
      json[r'createdAt'] = this.createdAt;
      json[r'current'] = this.current;
    if (this.deviceOS != null) {
      json[r'deviceOS'] = this.deviceOS;
    } else {
      json[r'deviceOS'] = null;
    }
    if (this.deviceType != null) {
      json[r'deviceType'] = this.deviceType;
    } else {
      json[r'deviceType'] = null;
    }
    if (this.expiresAt != null) {
      json[r'expiresAt'] = this.expiresAt;
    } else {
      json[r'expiresAt'] = null;
    }
      json[r'id'] = this.id;
      json[r'isPendingSyncReset'] = this.isPendingSyncReset;
      json[r'updatedAt'] = this.updatedAt;
    return json;
  }

  /// Returns a new [SessionResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SessionResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'appVersion'), 'Required key "SessionResponseDto[appVersion]" is missing from JSON.');
        assert(json.containsKey(r'createdAt'), 'Required key "SessionResponseDto[createdAt]" is missing from JSON.');
        assert(json[r'createdAt'] != null, 'Required key "SessionResponseDto[createdAt]" has a null value in JSON.');
        assert(json.containsKey(r'current'), 'Required key "SessionResponseDto[current]" is missing from JSON.');
        assert(json[r'current'] != null, 'Required key "SessionResponseDto[current]" has a null value in JSON.');
        assert(json.containsKey(r'id'), 'Required key "SessionResponseDto[id]" is missing from JSON.');
        assert(json[r'id'] != null, 'Required key "SessionResponseDto[id]" has a null value in JSON.');
        assert(json.containsKey(r'isPendingSyncReset'), 'Required key "SessionResponseDto[isPendingSyncReset]" is missing from JSON.');
        assert(json[r'isPendingSyncReset'] != null, 'Required key "SessionResponseDto[isPendingSyncReset]" has a null value in JSON.');
        assert(json.containsKey(r'updatedAt'), 'Required key "SessionResponseDto[updatedAt]" is missing from JSON.');
        assert(json[r'updatedAt'] != null, 'Required key "SessionResponseDto[updatedAt]" has a null value in JSON.');
        return true;
      }());

      return SessionResponseDto(
        appVersion: mapValueOfType<String>(json, r'appVersion'),
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        current: mapValueOfType<bool>(json, r'current')!,
        deviceOS: mapValueOfType<String>(json, r'deviceOS'),
        deviceType: mapValueOfType<String>(json, r'deviceType'),
        expiresAt: mapValueOfType<String>(json, r'expiresAt'),
        id: mapValueOfType<String>(json, r'id')!,
        isPendingSyncReset: mapValueOfType<bool>(json, r'isPendingSyncReset')!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<SessionResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SessionResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SessionResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SessionResponseDto> mapFromJson(dynamic json) {
    final map = <String, SessionResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SessionResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SessionResponseDto-objects as value to a dart map
  static Map<String, List<SessionResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SessionResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SessionResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'appVersion',
    'createdAt',
    'current',
    'id',
    'isPendingSyncReset',
    'updatedAt',
  };
}


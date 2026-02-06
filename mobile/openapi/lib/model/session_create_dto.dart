//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SessionCreateDto {
  /// Returns a new [SessionCreateDto] instance.
  SessionCreateDto({
    this.duration,
    this.deviceType,
    this.deviceOS,
  });

  /// Session duration in seconds
  ///
  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  num? duration;

  /// Device type
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceType;

  /// Device OS
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? deviceOS;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SessionCreateDto &&
    other.duration == duration &&
    other.deviceType == deviceType &&
    other.deviceOS == deviceOS;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duration == null ? 0 : duration!.hashCode) +
    (deviceType == null ? 0 : deviceType!.hashCode) +
    (deviceOS == null ? 0 : deviceOS!.hashCode);

  @override
  String toString() => 'SessionCreateDto[duration=$duration, deviceType=$deviceType, deviceOS=$deviceOS]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.duration != null) {
      json[r'duration'] = this.duration;
    } else {
    //  json[r'duration'] = null;
    }
    if (this.deviceType != null) {
      json[r'deviceType'] = this.deviceType;
    } else {
    //  json[r'deviceType'] = null;
    }
    if (this.deviceOS != null) {
      json[r'deviceOS'] = this.deviceOS;
    } else {
    //  json[r'deviceOS'] = null;
    }
    return json;
  }

  /// Returns a new [SessionCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SessionCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "SessionCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SessionCreateDto(
        duration: num.parse('${json[r'duration']}'),
        deviceType: mapValueOfType<String>(json, r'deviceType'),
        deviceOS: mapValueOfType<String>(json, r'deviceOS'),
      );
    }
    return null;
  }

  static List<SessionCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SessionCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SessionCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SessionCreateDto> mapFromJson(dynamic json) {
    final map = <String, SessionCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SessionCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SessionCreateDto-objects as value to a dart map
  static Map<String, List<SessionCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SessionCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SessionCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


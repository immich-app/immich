//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SessionUpdateDto {
  /// Returns a new [SessionUpdateDto] instance.
  SessionUpdateDto({
    this.isPendingSyncReset,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isPendingSyncReset;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SessionUpdateDto &&
    other.isPendingSyncReset == isPendingSyncReset;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isPendingSyncReset == null ? 0 : isPendingSyncReset!.hashCode);

  @override
  String toString() => 'SessionUpdateDto[isPendingSyncReset=$isPendingSyncReset]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.isPendingSyncReset != null) {
      json[r'isPendingSyncReset'] = this.isPendingSyncReset;
    } else {
    //  json[r'isPendingSyncReset'] = null;
    }
    return json;
  }

  /// Returns a new [SessionUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SessionUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SessionUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SessionUpdateDto(
        isPendingSyncReset: mapValueOfType<bool>(json, r'isPendingSyncReset'),
      );
    }
    return null;
  }

  static List<SessionUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SessionUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SessionUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SessionUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SessionUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SessionUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SessionUpdateDto-objects as value to a dart map
  static Map<String, List<SessionUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SessionUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SessionUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


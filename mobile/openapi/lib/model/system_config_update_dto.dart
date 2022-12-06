//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigUpdateDto {
  /// Returns a new [SystemConfigUpdateDto] instance.
  SystemConfigUpdateDto({
    this.ffmpeg,
    this.oauth,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigUpdateFFmpegDto? ffmpeg;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  SystemConfigUpdateOAuthDto? oauth;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigUpdateDto &&
     other.ffmpeg == ffmpeg &&
     other.oauth == oauth;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ffmpeg == null ? 0 : ffmpeg!.hashCode) +
    (oauth == null ? 0 : oauth!.hashCode);

  @override
  String toString() => 'SystemConfigUpdateDto[ffmpeg=$ffmpeg, oauth=$oauth]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (ffmpeg != null) {
      _json[r'ffmpeg'] = ffmpeg;
    } else {
      _json[r'ffmpeg'] = null;
    }
    if (oauth != null) {
      _json[r'oauth'] = oauth;
    } else {
      _json[r'oauth'] = null;
    }
    return _json;
  }

  /// Returns a new [SystemConfigUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigUpdateDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigUpdateDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigUpdateDto(
        ffmpeg: SystemConfigUpdateFFmpegDto.fromJson(json[r'ffmpeg']),
        oauth: SystemConfigUpdateOAuthDto.fromJson(json[r'oauth']),
      );
    }
    return null;
  }

  static List<SystemConfigUpdateDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigUpdateDto-objects as value to a dart map
  static Map<String, List<SystemConfigUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigUpdateDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


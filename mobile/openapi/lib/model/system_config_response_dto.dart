//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigResponseDto {
  /// Returns a new [SystemConfigResponseDto] instance.
  SystemConfigResponseDto({
    this.config = const [],
  });

  List<SystemConfigResponseItem> config;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigResponseDto &&
     other.config == config;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (config.hashCode);

  @override
  String toString() => 'SystemConfigResponseDto[config=$config]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'config'] = config;
    return _json;
  }

  /// Returns a new [SystemConfigResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigResponseDto(
        config: SystemConfigResponseItem.listFromJson(json[r'config'])!,
      );
    }
    return null;
  }

  static List<SystemConfigResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigResponseDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigResponseDto-objects as value to a dart map
  static Map<String, List<SystemConfigResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'config',
  };
}


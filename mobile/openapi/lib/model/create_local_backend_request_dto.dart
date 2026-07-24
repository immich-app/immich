//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateLocalBackendRequestDto {
  /// Returns a new [CreateLocalBackendRequestDto] instance.
  CreateLocalBackendRequestDto({
    required this.path,
  });

  String path;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateLocalBackendRequestDto &&
    other.path == path;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (path.hashCode);

  @override
  String toString() => 'CreateLocalBackendRequestDto[path=$path]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'path'] = this.path;
    return json;
  }

  /// Returns a new [CreateLocalBackendRequestDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateLocalBackendRequestDto? fromJson(dynamic value) {
    upgradeDto(value, "CreateLocalBackendRequestDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateLocalBackendRequestDto(
        path: mapValueOfType<String>(json, r'path')!,
      );
    }
    return null;
  }

  static List<CreateLocalBackendRequestDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateLocalBackendRequestDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateLocalBackendRequestDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateLocalBackendRequestDto> mapFromJson(dynamic json) {
    final map = <String, CreateLocalBackendRequestDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateLocalBackendRequestDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateLocalBackendRequestDto-objects as value to a dart map
  static Map<String, List<CreateLocalBackendRequestDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateLocalBackendRequestDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateLocalBackendRequestDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'path',
  };
}


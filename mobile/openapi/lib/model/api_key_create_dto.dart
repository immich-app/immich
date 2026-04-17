//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ApiKeyCreateDto {
  /// Returns a new [ApiKeyCreateDto] instance.
  ApiKeyCreateDto({
    this.name,
    this.permissions = const [],
  });

  /// API key name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// List of permissions
  List<Permission> permissions;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ApiKeyCreateDto &&
    other.name == name &&
    _deepEquality.equals(other.permissions, permissions);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (permissions.hashCode);

  @override
  String toString() => 'ApiKeyCreateDto[name=$name, permissions=$permissions]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
      json[r'permissions'] = this.permissions;
    return json;
  }

  /// Returns a new [ApiKeyCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ApiKeyCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "ApiKeyCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ApiKeyCreateDto(
        name: mapValueOfType<String>(json, r'name'),
        permissions: Permission.listFromJson(json[r'permissions']),
      );
    }
    return null;
  }

  static List<ApiKeyCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ApiKeyCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ApiKeyCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ApiKeyCreateDto> mapFromJson(dynamic json) {
    final map = <String, ApiKeyCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ApiKeyCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ApiKeyCreateDto-objects as value to a dart map
  static Map<String, List<ApiKeyCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ApiKeyCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ApiKeyCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'permissions',
  };
}


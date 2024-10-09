//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class APIKeyResponseDto {
  /// Returns a new [APIKeyResponseDto] instance.
  APIKeyResponseDto({
    required this.createdAt,
    required this.id,
    required this.name,
    this.permissions = const [],
    required this.updatedAt,
  });

  DateTime createdAt;

  String id;

  String name;

  List<Permission> permissions;

  DateTime updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is APIKeyResponseDto &&
    other.createdAt == createdAt &&
    other.id == id &&
    other.name == name &&
    _deepEquality.equals(other.permissions, permissions) &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (id.hashCode) +
    (name.hashCode) +
    (permissions.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'APIKeyResponseDto[createdAt=$createdAt, id=$id, name=$name, permissions=$permissions, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'permissions'] = this.permissions;
      json[r'updatedAt'] = this.updatedAt.toUtc().toIso8601String();
    return json;
  }

  /// Returns a new [APIKeyResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static APIKeyResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "APIKeyResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return APIKeyResponseDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        permissions: Permission.listFromJson(json[r'permissions']),
        updatedAt: mapDateTime(json, r'updatedAt', r'')!,
      );
    }
    return null;
  }

  static List<APIKeyResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <APIKeyResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = APIKeyResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, APIKeyResponseDto> mapFromJson(dynamic json) {
    final map = <String, APIKeyResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of APIKeyResponseDto-objects as value to a dart map
  static Map<String, List<APIKeyResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<APIKeyResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = APIKeyResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'name',
    'permissions',
    'updatedAt',
  };
}


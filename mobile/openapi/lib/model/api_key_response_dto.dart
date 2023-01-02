//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class APIKeyResponseDto {
  /// Returns a new [APIKeyResponseDto] instance.
  APIKeyResponseDto({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
  });

  num id;

  String name;

  String createdAt;

  String updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is APIKeyResponseDto &&
     other.id == id &&
     other.name == name &&
     other.createdAt == createdAt &&
     other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (createdAt.hashCode) +
    (updatedAt.hashCode);

  @override
  String toString() => 'APIKeyResponseDto[id=$id, name=$name, createdAt=$createdAt, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'id'] = id;
      _json[r'name'] = name;
      _json[r'createdAt'] = createdAt;
      _json[r'updatedAt'] = updatedAt;
    return _json;
  }

  /// Returns a new [APIKeyResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static APIKeyResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "APIKeyResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "APIKeyResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return APIKeyResponseDto(
        id: json[r'id'] == null
            ? null
            : num.parse(json[r'id'].toString()),
        name: mapValueOfType<String>(json, r'name')!,
        createdAt: mapValueOfType<String>(json, r'createdAt')!,
        updatedAt: mapValueOfType<String>(json, r'updatedAt')!,
      );
    }
    return null;
  }

  static List<APIKeyResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = APIKeyResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'createdAt',
    'updatedAt',
  };
}


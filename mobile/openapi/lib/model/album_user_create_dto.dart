//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumUserCreateDto {
  /// Returns a new [AlbumUserCreateDto] instance.
  AlbumUserCreateDto({
    required this.role,
    required this.userId,
  });

  AlbumUserRole role;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumUserCreateDto &&
    other.role == role &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'AlbumUserCreateDto[role=$role, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [AlbumUserCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumUserCreateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumUserCreateDto(
        role: AlbumUserRole.fromJson(json[r'role'])!,
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<AlbumUserCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumUserCreateDto> mapFromJson(dynamic json) {
    final map = <String, AlbumUserCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumUserCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumUserCreateDto-objects as value to a dart map
  static Map<String, List<AlbumUserCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumUserCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumUserCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'role',
    'userId',
  };
}


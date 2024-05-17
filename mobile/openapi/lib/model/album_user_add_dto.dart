//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumUserAddDto {
  /// Returns a new [AlbumUserAddDto] instance.
  AlbumUserAddDto({
    this.role,
    required this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumUserRole? role;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumUserAddDto &&
    other.role == role &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role == null ? 0 : role!.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'AlbumUserAddDto[role=$role, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.role != null) {
      json[r'role'] = this.role;
    } else {
    //  json[r'role'] = null;
    }
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [AlbumUserAddDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumUserAddDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumUserAddDto(
        role: AlbumUserRole.fromJson(json[r'role']),
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<AlbumUserAddDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumUserAddDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumUserAddDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumUserAddDto> mapFromJson(dynamic json) {
    final map = <String, AlbumUserAddDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumUserAddDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumUserAddDto-objects as value to a dart map
  static Map<String, List<AlbumUserAddDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumUserAddDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumUserAddDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'userId',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumGroupDto {
  /// Returns a new [AlbumGroupDto] instance.
  AlbumGroupDto({
    required this.groupId,
    this.role,
  });

  String groupId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AlbumUserRole? role;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumGroupDto &&
    other.groupId == groupId &&
    other.role == role;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (groupId.hashCode) +
    (role == null ? 0 : role!.hashCode);

  @override
  String toString() => 'AlbumGroupDto[groupId=$groupId, role=$role]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'groupId'] = this.groupId;
    if (this.role != null) {
      json[r'role'] = this.role;
    } else {
    //  json[r'role'] = null;
    }
    return json;
  }

  /// Returns a new [AlbumGroupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumGroupDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumGroupDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumGroupDto(
        groupId: mapValueOfType<String>(json, r'groupId')!,
        role: AlbumUserRole.fromJson(json[r'role']),
      );
    }
    return null;
  }

  static List<AlbumGroupDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumGroupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumGroupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumGroupDto> mapFromJson(dynamic json) {
    final map = <String, AlbumGroupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumGroupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumGroupDto-objects as value to a dart map
  static Map<String, List<AlbumGroupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumGroupDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumGroupDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'groupId',
  };
}


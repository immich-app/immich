//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAlbumUserDto {
  /// Returns a new [UpdateAlbumUserDto] instance.
  UpdateAlbumUserDto({
    required this.role,
  });

  AlbumUserRole role;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAlbumUserDto &&
    other.role == role;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode);

  @override
  String toString() => 'UpdateAlbumUserDto[role=$role]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
    return json;
  }

  /// Returns a new [UpdateAlbumUserDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAlbumUserDto? fromJson(dynamic value) {
    upgradeDto(value, "UpdateAlbumUserDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateAlbumUserDto(
        role: AlbumUserRole.fromJson(json[r'role'])!,
      );
    }
    return null;
  }

  static List<UpdateAlbumUserDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAlbumUserDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAlbumUserDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAlbumUserDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAlbumUserDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAlbumUserDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAlbumUserDto-objects as value to a dart map
  static Map<String, List<UpdateAlbumUserDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAlbumUserDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateAlbumUserDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'role',
  };
}


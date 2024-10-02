//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AddUsersDto {
  /// Returns a new [AddUsersDto] instance.
  AddUsersDto({
    this.albumUsers = const [],
  });

  List<AlbumUserAddDto> albumUsers;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AddUsersDto &&
    _deepEquality.equals(other.albumUsers, albumUsers);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumUsers.hashCode);

  @override
  String toString() => 'AddUsersDto[albumUsers=$albumUsers]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumUsers'] = this.albumUsers;
    return json;
  }

  /// Returns a new [AddUsersDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AddUsersDto? fromJson(dynamic value) {
    upgradeDto(value, "AddUsersDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AddUsersDto(
        albumUsers: AlbumUserAddDto.listFromJson(json[r'albumUsers']),
      );
    }
    return null;
  }

  static List<AddUsersDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AddUsersDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AddUsersDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AddUsersDto> mapFromJson(dynamic json) {
    final map = <String, AddUsersDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AddUsersDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AddUsersDto-objects as value to a dart map
  static Map<String, List<AddUsersDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AddUsersDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AddUsersDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumUsers',
  };
}


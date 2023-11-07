//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ValidatePrivateAlbumPasswordDto {
  /// Returns a new [ValidatePrivateAlbumPasswordDto] instance.
  ValidatePrivateAlbumPasswordDto({
    required this.password,
  });

  String password;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ValidatePrivateAlbumPasswordDto &&
     other.password == password;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (password.hashCode);

  @override
  String toString() => 'ValidatePrivateAlbumPasswordDto[password=$password]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'password'] = this.password;
    return json;
  }

  /// Returns a new [ValidatePrivateAlbumPasswordDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ValidatePrivateAlbumPasswordDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ValidatePrivateAlbumPasswordDto(
        password: mapValueOfType<String>(json, r'password')!,
      );
    }
    return null;
  }

  static List<ValidatePrivateAlbumPasswordDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ValidatePrivateAlbumPasswordDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ValidatePrivateAlbumPasswordDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ValidatePrivateAlbumPasswordDto> mapFromJson(dynamic json) {
    final map = <String, ValidatePrivateAlbumPasswordDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ValidatePrivateAlbumPasswordDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ValidatePrivateAlbumPasswordDto-objects as value to a dart map
  static Map<String, List<ValidatePrivateAlbumPasswordDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ValidatePrivateAlbumPasswordDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ValidatePrivateAlbumPasswordDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'password',
  };
}


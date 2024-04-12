//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SetAlbumPermissionDto {
  /// Returns a new [SetAlbumPermissionDto] instance.
  SetAlbumPermissionDto({
    required this.readonly,
  });

  bool readonly;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SetAlbumPermissionDto &&
    other.readonly == readonly;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (readonly.hashCode);

  @override
  String toString() => 'SetAlbumPermissionDto[readonly=$readonly]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'readonly'] = this.readonly;
    return json;
  }

  /// Returns a new [SetAlbumPermissionDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SetAlbumPermissionDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SetAlbumPermissionDto(
        readonly: mapValueOfType<bool>(json, r'readonly')!,
      );
    }
    return null;
  }

  static List<SetAlbumPermissionDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SetAlbumPermissionDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SetAlbumPermissionDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SetAlbumPermissionDto> mapFromJson(dynamic json) {
    final map = <String, SetAlbumPermissionDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SetAlbumPermissionDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SetAlbumPermissionDto-objects as value to a dart map
  static Map<String, List<SetAlbumPermissionDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SetAlbumPermissionDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SetAlbumPermissionDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'readonly',
  };
}


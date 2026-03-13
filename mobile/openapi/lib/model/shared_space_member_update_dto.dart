//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceMemberUpdateDto {
  /// Returns a new [SharedSpaceMemberUpdateDto] instance.
  SharedSpaceMemberUpdateDto({
    required this.role,
  });

  /// Member role
  SharedSpaceRole role;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceMemberUpdateDto &&
    other.role == role;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (role.hashCode);

  @override
  String toString() => 'SharedSpaceMemberUpdateDto[role=$role]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'role'] = this.role;
    return json;
  }

  /// Returns a new [SharedSpaceMemberUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceMemberUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceMemberUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceMemberUpdateDto(
        role: SharedSpaceRole.fromJson(json[r'role'])!,
      );
    }
    return null;
  }

  static List<SharedSpaceMemberUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceMemberUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceMemberUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceMemberUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceMemberUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceMemberUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceMemberUpdateDto-objects as value to a dart map
  static Map<String, List<SharedSpaceMemberUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceMemberUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceMemberUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'role',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceCreateDto {
  /// Returns a new [SharedSpaceCreateDto] instance.
  SharedSpaceCreateDto({
    this.color = UserAvatarColor.primary,
    this.description,
    required this.name,
  });

  /// Space color
  UserAvatarColor color;

  /// Space description
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  /// Space name
  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceCreateDto &&
    other.color == color &&
    other.description == description &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'SharedSpaceCreateDto[color=$color, description=$description, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'color'] = this.color;
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [SharedSpaceCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceCreateDto(
        color: UserAvatarColor.fromJson(json[r'color']) ?? UserAvatarColor.primary,
        description: mapValueOfType<String>(json, r'description'),
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<SharedSpaceCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceCreateDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceCreateDto-objects as value to a dart map
  static Map<String, List<SharedSpaceCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagUpdateDto {
  /// Returns a new [TagUpdateDto] instance.
  TagUpdateDto({
    this.color = const Optional.absent(),
    this.name = const Optional.absent(),
  });

  /// Tag color (hex)
  Optional<String?> color;

  /// Tag name
  Optional<String?> name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagUpdateDto &&
    other.color == color &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'TagUpdateDto[color=$color, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color.isPresent) {
      final value = this.color.value;
      json[r'color'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    return json;
  }

  /// Returns a new [TagUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "TagUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagUpdateDto(
        color: json.containsKey(r'color') ? Optional.present(mapValueOfType<String>(json, r'color')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<TagUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagUpdateDto> mapFromJson(dynamic json) {
    final map = <String, TagUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagUpdateDto-objects as value to a dart map
  static Map<String, List<TagUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


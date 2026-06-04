//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class TagCreateDto {
  /// Returns a new [TagCreateDto] instance.
  TagCreateDto({
    this.color = const Optional.absent(),
    required this.name,
    this.parentId = const Optional.absent(),
  });

  /// Tag color (hex)
  Optional<String?> color;

  /// Tag name
  String name;

  /// Parent tag ID
  Optional<String?> parentId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is TagCreateDto &&
    other.color == color &&
    other.name == name &&
    other.parentId == parentId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (color == null ? 0 : color!.hashCode) +
    (name.hashCode) +
    (parentId == null ? 0 : parentId!.hashCode);

  @override
  String toString() => 'TagCreateDto[color=$color, name=$name, parentId=$parentId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.color.isPresent) {
      final value = this.color.value;
      json[r'color'] = value;
    }
      json[r'name'] = this.name;
    if (this.parentId.isPresent) {
      final value = this.parentId.value;
      json[r'parentId'] = value;
    }
    return json;
  }

  /// Returns a new [TagCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static TagCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "TagCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return TagCreateDto(
        color: json.containsKey(r'color') ? Optional.present(mapValueOfType<String>(json, r'color')) : const Optional.absent(),
        name: mapValueOfType<String>(json, r'name')!,
        parentId: json.containsKey(r'parentId') ? Optional.present(mapValueOfType<String>(json, r'parentId')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<TagCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <TagCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = TagCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, TagCreateDto> mapFromJson(dynamic json) {
    final map = <String, TagCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = TagCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of TagCreateDto-objects as value to a dart map
  static Map<String, List<TagCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<TagCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = TagCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
  };
}


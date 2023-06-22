//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateTagDto {
  /// Returns a new [CreateTagDto] instance.
  CreateTagDto({
    required this.type,
    required this.name,
  });

  TagTypeEnum type;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateTagDto &&
     other.type == type &&
     other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (type.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'CreateTagDto[type=$type, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'type'] = this.type;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [CreateTagDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateTagDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CreateTagDto(
        type: TagTypeEnum.fromJson(json[r'type'])!,
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<CreateTagDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateTagDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateTagDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateTagDto> mapFromJson(dynamic json) {
    final map = <String, CreateTagDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateTagDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateTagDto-objects as value to a dart map
  static Map<String, List<CreateTagDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateTagDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CreateTagDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'type',
    'name',
  };
}


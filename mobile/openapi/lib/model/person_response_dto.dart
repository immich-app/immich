//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonResponseDto {
  /// Returns a new [PersonResponseDto] instance.
  PersonResponseDto({
    required this.id,
    required this.name,
    required this.thumbnailPath,
    required this.isHidden,
  });

  String id;

  String name;

  String thumbnailPath;

  bool isHidden;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonResponseDto &&
     other.id == id &&
     other.name == name &&
     other.thumbnailPath == thumbnailPath &&
     other.isHidden == isHidden;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode) +
    (thumbnailPath.hashCode) +
    (isHidden.hashCode);

  @override
  String toString() => 'PersonResponseDto[id=$id, name=$name, thumbnailPath=$thumbnailPath, isHidden=$isHidden]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
      json[r'thumbnailPath'] = this.thumbnailPath;
      json[r'isHidden'] = this.isHidden;
    return json;
  }

  /// Returns a new [PersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonResponseDto(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
      );
    }
    return null;
  }

  static List<PersonResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonResponseDto-objects as value to a dart map
  static Map<String, List<PersonResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
    'thumbnailPath',
    'isHidden',
  };
}


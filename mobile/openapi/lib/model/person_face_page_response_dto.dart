//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonFacePageResponseDto {
  /// Returns a new [PersonFacePageResponseDto] instance.
  PersonFacePageResponseDto({
    this.faces = const [],
    required this.hasNextPage,
  });

  List<PersonFaceResponseDto> faces;

  bool hasNextPage;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonFacePageResponseDto &&
    _deepEquality.equals(other.faces, faces) &&
    other.hasNextPage == hasNextPage;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (faces.hashCode) +
    (hasNextPage.hashCode);

  @override
  String toString() => 'PersonFacePageResponseDto[faces=$faces, hasNextPage=$hasNextPage]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'faces'] = this.faces;
      json[r'hasNextPage'] = this.hasNextPage;
    return json;
  }

  /// Returns a new [PersonFacePageResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonFacePageResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonFacePageResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonFacePageResponseDto(
        faces: PersonFaceResponseDto.listFromJson(json[r'faces']),
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage')!,
      );
    }
    return null;
  }

  static List<PersonFacePageResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonFacePageResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonFacePageResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonFacePageResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonFacePageResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonFacePageResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonFacePageResponseDto-objects as value to a dart map
  static Map<String, List<PersonFacePageResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonFacePageResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonFacePageResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'faces',
    'hasNextPage',
  };
}


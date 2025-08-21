//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonWithFacesResponseDto {
  /// Returns a new [PersonWithFacesResponseDto] instance.
  PersonWithFacesResponseDto({
    required this.birthDate,
    this.color,
    this.faces = const [],
    required this.id,
    this.isFavorite,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    this.updatedAt,
  });

  DateTime? birthDate;

  /// This property was added in v1.126.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? color;

  List<AssetFaceWithoutPersonResponseDto> faces;

  String id;

  /// This property was added in v1.126.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  bool isHidden;

  String name;

  String thumbnailPath;

  /// This property was added in v1.107.0
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? updatedAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonWithFacesResponseDto &&
    other.birthDate == birthDate &&
    other.color == color &&
    _deepEquality.equals(other.faces, faces) &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (faces.hashCode) +
    (id.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (thumbnailPath.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode);

  @override
  String toString() => 'PersonWithFacesResponseDto[birthDate=$birthDate, color=$color, faces=$faces, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.color != null) {
      json[r'color'] = this.color;
    } else {
    //  json[r'color'] = null;
    }
      json[r'faces'] = this.faces;
      json[r'id'] = this.id;
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
      json[r'thumbnailPath'] = this.thumbnailPath;
    if (this.updatedAt != null) {
      json[r'updatedAt'] = this.updatedAt!.toUtc().toIso8601String();
    } else {
    //  json[r'updatedAt'] = null;
    }
    return json;
  }

  /// Returns a new [PersonWithFacesResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonWithFacesResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonWithFacesResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonWithFacesResponseDto(
        birthDate: mapDateTime(json, r'birthDate', r''),
        color: mapValueOfType<String>(json, r'color'),
        faces: AssetFaceWithoutPersonResponseDto.listFromJson(json[r'faces']),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        updatedAt: mapDateTime(json, r'updatedAt', r''),
      );
    }
    return null;
  }

  static List<PersonWithFacesResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonWithFacesResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonWithFacesResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonWithFacesResponseDto> mapFromJson(dynamic json) {
    final map = <String, PersonWithFacesResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonWithFacesResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonWithFacesResponseDto-objects as value to a dart map
  static Map<String, List<PersonWithFacesResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonWithFacesResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonWithFacesResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'birthDate',
    'faces',
    'id',
    'isHidden',
    'name',
    'thumbnailPath',
  };
}


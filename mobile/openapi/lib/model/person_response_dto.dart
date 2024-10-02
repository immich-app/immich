//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonResponseDto {
  /// Returns a new [PersonResponseDto] instance.
  PersonResponseDto({
    required this.birthDate,
    required this.id,
    required this.isHidden,
    required this.name,
    required this.thumbnailPath,
    this.updatedAt,
  });

  DateTime? birthDate;

  String id;

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
  bool operator ==(Object other) => identical(this, other) || other is PersonResponseDto &&
    other.birthDate == birthDate &&
    other.id == id &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.thumbnailPath == thumbnailPath &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (id.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (thumbnailPath.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode);

  @override
  String toString() => 'PersonResponseDto[birthDate=$birthDate, id=$id, isHidden=$isHidden, name=$name, thumbnailPath=$thumbnailPath, updatedAt=$updatedAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
      json[r'id'] = this.id;
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

  /// Returns a new [PersonResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonResponseDto(
        birthDate: mapDateTime(json, r'birthDate', r''),
        id: mapValueOfType<String>(json, r'id')!,
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        updatedAt: mapDateTime(json, r'updatedAt', r''),
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
    'birthDate',
    'id',
    'isHidden',
    'name',
    'thumbnailPath',
  };
}


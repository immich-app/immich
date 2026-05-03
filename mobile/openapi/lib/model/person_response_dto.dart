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
    this.color,
    this.filterId,
    required this.id,
    this.isFavorite,
    required this.isHidden,
    required this.name,
    this.numberOfAssets,
    this.primaryProfile,
    this.species,
    required this.thumbnailPath,
    this.type = 'person',
    this.updatedAt,
  });

  /// Person date of birth
  DateTime? birthDate;

  /// Person color (hex)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? color;

  /// Scoped identity filter token
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? filterId;

  /// Person ID
  String id;

  /// Is favorite
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isFavorite;

  /// Is hidden
  bool isHidden;

  /// Person name
  String name;

  /// Accessible asset count for this grouped person
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? numberOfAssets;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  ScopedPrimaryProfile? primaryProfile;

  /// Pet species (e.g. dog, cat)
  String? species;

  /// Thumbnail path
  String thumbnailPath;

  /// Entity type (person or pet)
  String type;

  /// Last update date
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
    other.color == color &&
    other.filterId == filterId &&
    other.id == id &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.numberOfAssets == numberOfAssets &&
    other.primaryProfile == primaryProfile &&
    other.species == species &&
    other.thumbnailPath == thumbnailPath &&
    other.type == type &&
    other.updatedAt == updatedAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (filterId == null ? 0 : filterId!.hashCode) +
    (id.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden.hashCode) +
    (name.hashCode) +
    (numberOfAssets == null ? 0 : numberOfAssets!.hashCode) +
    (primaryProfile == null ? 0 : primaryProfile!.hashCode) +
    (species == null ? 0 : species!.hashCode) +
    (thumbnailPath.hashCode) +
    (type.hashCode) +
    (updatedAt == null ? 0 : updatedAt!.hashCode);

  @override
  String toString() => 'PersonResponseDto[birthDate=$birthDate, color=$color, filterId=$filterId, id=$id, isFavorite=$isFavorite, isHidden=$isHidden, name=$name, numberOfAssets=$numberOfAssets, primaryProfile=$primaryProfile, species=$species, thumbnailPath=$thumbnailPath, type=$type, updatedAt=$updatedAt]';

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
    if (this.filterId != null) {
      json[r'filterId'] = this.filterId;
    } else {
    //  json[r'filterId'] = null;
    }
      json[r'id'] = this.id;
    if (this.isFavorite != null) {
      json[r'isFavorite'] = this.isFavorite;
    } else {
    //  json[r'isFavorite'] = null;
    }
      json[r'isHidden'] = this.isHidden;
      json[r'name'] = this.name;
    if (this.numberOfAssets != null) {
      json[r'numberOfAssets'] = this.numberOfAssets;
    } else {
    //  json[r'numberOfAssets'] = null;
    }
    if (this.primaryProfile != null) {
      json[r'primaryProfile'] = this.primaryProfile;
    } else {
    //  json[r'primaryProfile'] = null;
    }
    if (this.species != null) {
      json[r'species'] = this.species;
    } else {
    //  json[r'species'] = null;
    }
      json[r'thumbnailPath'] = this.thumbnailPath;
      json[r'type'] = this.type;
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
        color: mapValueOfType<String>(json, r'color'),
        filterId: mapValueOfType<String>(json, r'filterId'),
        id: mapValueOfType<String>(json, r'id')!,
        isFavorite: mapValueOfType<bool>(json, r'isFavorite'),
        isHidden: mapValueOfType<bool>(json, r'isHidden')!,
        name: mapValueOfType<String>(json, r'name')!,
        numberOfAssets: mapValueOfType<int>(json, r'numberOfAssets'),
        primaryProfile: ScopedPrimaryProfile.fromJson(json[r'primaryProfile']),
        species: mapValueOfType<String>(json, r'species'),
        thumbnailPath: mapValueOfType<String>(json, r'thumbnailPath')!,
        type: mapValueOfType<String>(json, r'type') ?? 'person',
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonUpdateDto {
  /// Returns a new [PersonUpdateDto] instance.
  PersonUpdateDto({
    this.birthDate = const Optional.absent(),
    this.color = const Optional.absent(),
    this.featureFaceAssetId = const Optional.absent(),
    this.isFavorite = const Optional.absent(),
    this.isHidden = const Optional.absent(),
    this.name = const Optional.absent(),
  });

  /// Person date of birth
  Optional<DateTime?> birthDate;

  /// Person color (hex)
  Optional<String?> color;

  /// Asset ID used for feature face thumbnail
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> featureFaceAssetId;

  /// Mark as favorite
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isFavorite;

  /// Person visibility (hidden)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> isHidden;

  /// Person name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<String?> name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonUpdateDto &&
    other.birthDate == birthDate &&
    other.color == color &&
    other.featureFaceAssetId == featureFaceAssetId &&
    other.isFavorite == isFavorite &&
    other.isHidden == isHidden &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (color == null ? 0 : color!.hashCode) +
    (featureFaceAssetId == null ? 0 : featureFaceAssetId!.hashCode) +
    (isFavorite == null ? 0 : isFavorite!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode) +
    (name == null ? 0 : name!.hashCode);

  @override
  String toString() => 'PersonUpdateDto[birthDate=$birthDate, color=$color, featureFaceAssetId=$featureFaceAssetId, isFavorite=$isFavorite, isHidden=$isHidden, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate.isPresent) {
      final value = this.birthDate.value;
      json[r'birthDate'] = value == null ? null : _dateFormatter.format(value.toUtc());
    }
    if (this.color.isPresent) {
      final value = this.color.value;
      json[r'color'] = value;
    }
    if (this.featureFaceAssetId.isPresent) {
      final value = this.featureFaceAssetId.value;
      json[r'featureFaceAssetId'] = value;
    }
    if (this.isFavorite.isPresent) {
      final value = this.isFavorite.value;
      json[r'isFavorite'] = value;
    }
    if (this.isHidden.isPresent) {
      final value = this.isHidden.value;
      json[r'isHidden'] = value;
    }
    if (this.name.isPresent) {
      final value = this.name.value;
      json[r'name'] = value;
    }
    return json;
  }

  /// Returns a new [PersonUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "PersonUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonUpdateDto(
        birthDate: json.containsKey(r'birthDate') ? Optional.present(mapDateTime(json, r'birthDate', r'')) : const Optional.absent(),
        color: json.containsKey(r'color') ? Optional.present(mapValueOfType<String>(json, r'color')) : const Optional.absent(),
        featureFaceAssetId: json.containsKey(r'featureFaceAssetId') ? Optional.present(mapValueOfType<String>(json, r'featureFaceAssetId')) : const Optional.absent(),
        isFavorite: json.containsKey(r'isFavorite') ? Optional.present(mapValueOfType<bool>(json, r'isFavorite')) : const Optional.absent(),
        isHidden: json.containsKey(r'isHidden') ? Optional.present(mapValueOfType<bool>(json, r'isHidden')) : const Optional.absent(),
        name: json.containsKey(r'name') ? Optional.present(mapValueOfType<String>(json, r'name')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<PersonUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PersonUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PersonUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PersonUpdateDto> mapFromJson(dynamic json) {
    final map = <String, PersonUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PersonUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PersonUpdateDto-objects as value to a dart map
  static Map<String, List<PersonUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PersonUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PersonUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


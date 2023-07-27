//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PersonUpdateDto {
  /// Returns a new [PersonUpdateDto] instance.
  PersonUpdateDto({
    this.name,
    this.featureFaceAssetId,
    this.isHidden,
  });

  /// Person name.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Asset is used to get the feature face thumbnail.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? featureFaceAssetId;

  /// Person visibility
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isHidden;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PersonUpdateDto &&
     other.name == name &&
     other.featureFaceAssetId == featureFaceAssetId &&
     other.isHidden == isHidden;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name == null ? 0 : name!.hashCode) +
    (featureFaceAssetId == null ? 0 : featureFaceAssetId!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode);

  @override
  String toString() => 'PersonUpdateDto[name=$name, featureFaceAssetId=$featureFaceAssetId, isHidden=$isHidden]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.featureFaceAssetId != null) {
      json[r'featureFaceAssetId'] = this.featureFaceAssetId;
    } else {
    //  json[r'featureFaceAssetId'] = null;
    }
    if (this.isHidden != null) {
      json[r'isHidden'] = this.isHidden;
    } else {
    //  json[r'isHidden'] = null;
    }
    return json;
  }

  /// Returns a new [PersonUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PersonUpdateDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PersonUpdateDto(
        name: mapValueOfType<String>(json, r'name'),
        featureFaceAssetId: mapValueOfType<String>(json, r'featureFaceAssetId'),
        isHidden: mapValueOfType<bool>(json, r'isHidden'),
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


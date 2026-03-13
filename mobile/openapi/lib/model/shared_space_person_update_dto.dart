//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpacePersonUpdateDto {
  /// Returns a new [SharedSpacePersonUpdateDto] instance.
  SharedSpacePersonUpdateDto({
    this.birthDate,
    this.isHidden,
    this.name,
    this.representativeFaceId,
  });

  /// Person date of birth
  DateTime? birthDate;

  /// Person visibility (hidden)
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isHidden;

  /// Person name
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? name;

  /// Representative face ID
  String? representativeFaceId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpacePersonUpdateDto &&
    other.birthDate == birthDate &&
    other.isHidden == isHidden &&
    other.name == name &&
    other.representativeFaceId == representativeFaceId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (birthDate == null ? 0 : birthDate!.hashCode) +
    (isHidden == null ? 0 : isHidden!.hashCode) +
    (name == null ? 0 : name!.hashCode) +
    (representativeFaceId == null ? 0 : representativeFaceId!.hashCode);

  @override
  String toString() => 'SharedSpacePersonUpdateDto[birthDate=$birthDate, isHidden=$isHidden, name=$name, representativeFaceId=$representativeFaceId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.birthDate != null) {
      json[r'birthDate'] = _dateFormatter.format(this.birthDate!.toUtc());
    } else {
    //  json[r'birthDate'] = null;
    }
    if (this.isHidden != null) {
      json[r'isHidden'] = this.isHidden;
    } else {
    //  json[r'isHidden'] = null;
    }
    if (this.name != null) {
      json[r'name'] = this.name;
    } else {
    //  json[r'name'] = null;
    }
    if (this.representativeFaceId != null) {
      json[r'representativeFaceId'] = this.representativeFaceId;
    } else {
    //  json[r'representativeFaceId'] = null;
    }
    return json;
  }

  /// Returns a new [SharedSpacePersonUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpacePersonUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpacePersonUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpacePersonUpdateDto(
        birthDate: mapDateTime(json, r'birthDate', r''),
        isHidden: mapValueOfType<bool>(json, r'isHidden'),
        name: mapValueOfType<String>(json, r'name'),
        representativeFaceId: mapValueOfType<String>(json, r'representativeFaceId'),
      );
    }
    return null;
  }

  static List<SharedSpacePersonUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpacePersonUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpacePersonUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpacePersonUpdateDto> mapFromJson(dynamic json) {
    final map = <String, SharedSpacePersonUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpacePersonUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpacePersonUpdateDto-objects as value to a dart map
  static Map<String, List<SharedSpacePersonUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpacePersonUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpacePersonUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


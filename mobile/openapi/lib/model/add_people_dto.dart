//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AddPeopleDto {
  /// Returns a new [AddPeopleDto] instance.
  AddPeopleDto({
    this.ids = const [],
    this.together,
  });

  List<String> ids;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? together;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AddPeopleDto &&
    _deepEquality.equals(other.ids, ids) &&
    other.together == together;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (together == null ? 0 : together!.hashCode);

  @override
  String toString() => 'AddPeopleDto[ids=$ids, together=$together]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
    if (this.together != null) {
      json[r'together'] = this.together;
    } else {
    //  json[r'together'] = null;
    }
    return json;
  }

  /// Returns a new [AddPeopleDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AddPeopleDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AddPeopleDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        together: mapValueOfType<bool>(json, r'together'),
      );
    }
    return null;
  }

  static List<AddPeopleDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AddPeopleDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AddPeopleDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AddPeopleDto> mapFromJson(dynamic json) {
    final map = <String, AddPeopleDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AddPeopleDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AddPeopleDto-objects as value to a dart map
  static Map<String, List<AddPeopleDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AddPeopleDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AddPeopleDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}


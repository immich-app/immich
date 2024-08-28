//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleReponse {
  /// Returns a new [PeopleReponse] instance.
  PeopleReponse({
    required this.enabled,
  });

  bool enabled;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleReponse &&
    other.enabled == enabled;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode);

  @override
  String toString() => 'PeopleReponse[enabled=$enabled]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
    return json;
  }

  /// Returns a new [PeopleReponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleReponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleReponse(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
      );
    }
    return null;
  }

  static List<PeopleReponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleReponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleReponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleReponse> mapFromJson(dynamic json) {
    final map = <String, PeopleReponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleReponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleReponse-objects as value to a dart map
  static Map<String, List<PeopleReponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleReponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleReponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
  };
}


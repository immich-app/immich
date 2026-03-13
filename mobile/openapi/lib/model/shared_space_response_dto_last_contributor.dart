//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SharedSpaceResponseDtoLastContributor {
  /// Returns a new [SharedSpaceResponseDtoLastContributor] instance.
  SharedSpaceResponseDtoLastContributor({
    required this.id,
    required this.name,
  });

  String id;

  String name;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SharedSpaceResponseDtoLastContributor &&
    other.id == id &&
    other.name == name;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (id.hashCode) +
    (name.hashCode);

  @override
  String toString() => 'SharedSpaceResponseDtoLastContributor[id=$id, name=$name]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'id'] = this.id;
      json[r'name'] = this.name;
    return json;
  }

  /// Returns a new [SharedSpaceResponseDtoLastContributor] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SharedSpaceResponseDtoLastContributor? fromJson(dynamic value) {
    upgradeDto(value, "SharedSpaceResponseDtoLastContributor");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SharedSpaceResponseDtoLastContributor(
        id: mapValueOfType<String>(json, r'id')!,
        name: mapValueOfType<String>(json, r'name')!,
      );
    }
    return null;
  }

  static List<SharedSpaceResponseDtoLastContributor> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SharedSpaceResponseDtoLastContributor>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SharedSpaceResponseDtoLastContributor.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SharedSpaceResponseDtoLastContributor> mapFromJson(dynamic json) {
    final map = <String, SharedSpaceResponseDtoLastContributor>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SharedSpaceResponseDtoLastContributor.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SharedSpaceResponseDtoLastContributor-objects as value to a dart map
  static Map<String, List<SharedSpaceResponseDtoLastContributor>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SharedSpaceResponseDtoLastContributor>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SharedSpaceResponseDtoLastContributor.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'id',
    'name',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BaseJobData {
  /// Returns a new [BaseJobData] instance.
  BaseJobData({
    this.force,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? force;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BaseJobData &&
    other.force == force;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (force == null ? 0 : force!.hashCode);

  @override
  String toString() => 'BaseJobData[force=$force]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.force != null) {
      json[r'force'] = this.force;
    } else {
    //  json[r'force'] = null;
    }
    return json;
  }

  /// Returns a new [BaseJobData] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BaseJobData? fromJson(dynamic value) {
    upgradeDto(value, "BaseJobData");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BaseJobData(
        force: mapValueOfType<bool>(json, r'force'),
      );
    }
    return null;
  }

  static List<BaseJobData> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BaseJobData>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BaseJobData.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BaseJobData> mapFromJson(dynamic json) {
    final map = <String, BaseJobData>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BaseJobData.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BaseJobData-objects as value to a dart map
  static Map<String, List<BaseJobData>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BaseJobData>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BaseJobData.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


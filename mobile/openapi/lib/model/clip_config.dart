//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CLIPConfig {
  /// Returns a new [CLIPConfig] instance.
  CLIPConfig({
    required this.enabled,
    required this.modelName,
  });

  bool enabled;

  String modelName;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CLIPConfig &&
    other.enabled == enabled &&
    other.modelName == modelName;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (modelName.hashCode);

  @override
  String toString() => 'CLIPConfig[enabled=$enabled, modelName=$modelName]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'modelName'] = this.modelName;
    return json;
  }

  /// Returns a new [CLIPConfig] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CLIPConfig? fromJson(dynamic value) {
    upgradeDto(value, "CLIPConfig");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return CLIPConfig(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        modelName: mapValueOfType<String>(json, r'modelName')!,
      );
    }
    return null;
  }

  static List<CLIPConfig> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CLIPConfig>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CLIPConfig.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CLIPConfig> mapFromJson(dynamic json) {
    final map = <String, CLIPConfig>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CLIPConfig.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CLIPConfig-objects as value to a dart map
  static Map<String, List<CLIPConfig>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CLIPConfig>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = CLIPConfig.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'modelName',
  };
}


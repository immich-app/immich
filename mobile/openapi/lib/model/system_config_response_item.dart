//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigResponseItem {
  /// Returns a new [SystemConfigResponseItem] instance.
  SystemConfigResponseItem({
    required this.name,
    required this.key,
    required this.value,
    required this.defaultValue,
  });

  String name;

  SystemConfigKey key;

  String value;

  String defaultValue;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigResponseItem &&
     other.name == name &&
     other.key == key &&
     other.value == value &&
     other.defaultValue == defaultValue;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (name.hashCode) +
    (key.hashCode) +
    (value.hashCode) +
    (defaultValue.hashCode);

  @override
  String toString() => 'SystemConfigResponseItem[name=$name, key=$key, value=$value, defaultValue=$defaultValue]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'name'] = name;
      _json[r'key'] = key;
      _json[r'value'] = value;
      _json[r'defaultValue'] = defaultValue;
    return _json;
  }

  /// Returns a new [SystemConfigResponseItem] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigResponseItem? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "SystemConfigResponseItem[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "SystemConfigResponseItem[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return SystemConfigResponseItem(
        name: mapValueOfType<String>(json, r'name')!,
        key: SystemConfigKey.fromJson(json[r'key'])!,
        value: mapValueOfType<String>(json, r'value')!,
        defaultValue: mapValueOfType<String>(json, r'defaultValue')!,
      );
    }
    return null;
  }

  static List<SystemConfigResponseItem>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigResponseItem>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigResponseItem.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigResponseItem> mapFromJson(dynamic json) {
    final map = <String, SystemConfigResponseItem>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigResponseItem.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigResponseItem-objects as value to a dart map
  static Map<String, List<SystemConfigResponseItem>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigResponseItem>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigResponseItem.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'name',
    'key',
    'value',
    'defaultValue',
  };
}


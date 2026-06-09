//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class FoldersResponse {
  /// Returns a new [FoldersResponse] instance.
  FoldersResponse({
    required this.enabled,
    required this.sidebarWeb,
  });

  /// Whether folders are enabled
  bool enabled;

  /// Whether folders appear in web sidebar
  bool sidebarWeb;

  @override
  bool operator ==(Object other) => identical(this, other) || other is FoldersResponse &&
    other.enabled == enabled &&
    other.sidebarWeb == sidebarWeb;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (enabled.hashCode) +
    (sidebarWeb.hashCode);

  @override
  String toString() => 'FoldersResponse[enabled=$enabled, sidebarWeb=$sidebarWeb]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'enabled'] = this.enabled;
      json[r'sidebarWeb'] = this.sidebarWeb;
    return json;
  }

  /// Returns a new [FoldersResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static FoldersResponse? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        assert(json.containsKey(r'enabled'), 'Required key "FoldersResponse[enabled]" is missing from JSON.');
        assert(json[r'enabled'] != null, 'Required key "FoldersResponse[enabled]" has a null value in JSON.');
        assert(json.containsKey(r'sidebarWeb'), 'Required key "FoldersResponse[sidebarWeb]" is missing from JSON.');
        assert(json[r'sidebarWeb'] != null, 'Required key "FoldersResponse[sidebarWeb]" has a null value in JSON.');
        return true;
      }());

      return FoldersResponse(
        enabled: mapValueOfType<bool>(json, r'enabled')!,
        sidebarWeb: mapValueOfType<bool>(json, r'sidebarWeb')!,
      );
    }
    return null;
  }

  static List<FoldersResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <FoldersResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = FoldersResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, FoldersResponse> mapFromJson(dynamic json) {
    final map = <String, FoldersResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = FoldersResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of FoldersResponse-objects as value to a dart map
  static Map<String, List<FoldersResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<FoldersResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = FoldersResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'enabled',
    'sidebarWeb',
  };
}


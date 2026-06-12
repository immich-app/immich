//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RecentlyAddedResponse {
  /// Returns a new [RecentlyAddedResponse] instance.
  RecentlyAddedResponse({
    required this.sidebarWeb,
  });

  /// Whether the recently added page appears in the web sidebar
  bool sidebarWeb;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RecentlyAddedResponse &&
    other.sidebarWeb == sidebarWeb;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sidebarWeb.hashCode);

  @override
  String toString() => 'RecentlyAddedResponse[sidebarWeb=$sidebarWeb]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'sidebarWeb'] = this.sidebarWeb;
    return json;
  }

  /// Returns a new [RecentlyAddedResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RecentlyAddedResponse? fromJson(dynamic value) {
    upgradeDto(value, "RecentlyAddedResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RecentlyAddedResponse(
        sidebarWeb: mapValueOfType<bool>(json, r'sidebarWeb')!,
      );
    }
    return null;
  }

  static List<RecentlyAddedResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RecentlyAddedResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RecentlyAddedResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RecentlyAddedResponse> mapFromJson(dynamic json) {
    final map = <String, RecentlyAddedResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RecentlyAddedResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RecentlyAddedResponse-objects as value to a dart map
  static Map<String, List<RecentlyAddedResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RecentlyAddedResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RecentlyAddedResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'sidebarWeb',
  };
}


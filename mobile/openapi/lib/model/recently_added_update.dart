//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class RecentlyAddedUpdate {
  /// Returns a new [RecentlyAddedUpdate] instance.
  RecentlyAddedUpdate({
    this.sidebarWeb = const Optional.absent(),
  });

  /// Whether the recently added page appears in the web sidebar
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<bool?> sidebarWeb;

  @override
  bool operator ==(Object other) => identical(this, other) || other is RecentlyAddedUpdate &&
    other.sidebarWeb == sidebarWeb;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (sidebarWeb == null ? 0 : sidebarWeb!.hashCode);

  @override
  String toString() => 'RecentlyAddedUpdate[sidebarWeb=$sidebarWeb]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.sidebarWeb.isPresent) {
      final value = this.sidebarWeb.value;
      json[r'sidebarWeb'] = value;
    }
    return json;
  }

  /// Returns a new [RecentlyAddedUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static RecentlyAddedUpdate? fromJson(dynamic value) {
    upgradeDto(value, "RecentlyAddedUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return RecentlyAddedUpdate(
        sidebarWeb: json.containsKey(r'sidebarWeb') ? Optional.present(mapValueOfType<bool>(json, r'sidebarWeb')) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<RecentlyAddedUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <RecentlyAddedUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = RecentlyAddedUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, RecentlyAddedUpdate> mapFromJson(dynamic json) {
    final map = <String, RecentlyAddedUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = RecentlyAddedUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of RecentlyAddedUpdate-objects as value to a dart map
  static Map<String, List<RecentlyAddedUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<RecentlyAddedUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = RecentlyAddedUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


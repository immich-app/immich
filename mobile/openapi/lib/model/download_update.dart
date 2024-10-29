//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DownloadUpdate {
  /// Returns a new [DownloadUpdate] instance.
  DownloadUpdate({
    this.archiveSize,
    this.includeEmbeddedVideos,
  });

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? archiveSize;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? includeEmbeddedVideos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DownloadUpdate &&
    other.archiveSize == archiveSize &&
    other.includeEmbeddedVideos == includeEmbeddedVideos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (archiveSize == null ? 0 : archiveSize!.hashCode) +
    (includeEmbeddedVideos == null ? 0 : includeEmbeddedVideos!.hashCode);

  @override
  String toString() => 'DownloadUpdate[archiveSize=$archiveSize, includeEmbeddedVideos=$includeEmbeddedVideos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.archiveSize != null) {
      json[r'archiveSize'] = this.archiveSize;
    } else {
    //  json[r'archiveSize'] = null;
    }
    if (this.includeEmbeddedVideos != null) {
      json[r'includeEmbeddedVideos'] = this.includeEmbeddedVideos;
    } else {
    //  json[r'includeEmbeddedVideos'] = null;
    }
    return json;
  }

  /// Returns a new [DownloadUpdate] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DownloadUpdate? fromJson(dynamic value) {
    upgradeDto(value, "DownloadUpdate");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DownloadUpdate(
        archiveSize: mapValueOfType<int>(json, r'archiveSize'),
        includeEmbeddedVideos: mapValueOfType<bool>(json, r'includeEmbeddedVideos'),
      );
    }
    return null;
  }

  static List<DownloadUpdate> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DownloadUpdate>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DownloadUpdate.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DownloadUpdate> mapFromJson(dynamic json) {
    final map = <String, DownloadUpdate>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DownloadUpdate.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DownloadUpdate-objects as value to a dart map
  static Map<String, List<DownloadUpdate>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DownloadUpdate>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DownloadUpdate.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DownloadResponse {
  /// Returns a new [DownloadResponse] instance.
  DownloadResponse({
    required this.archiveSize,
    this.includeEmbeddedVideos = false,
  });

  int archiveSize;

  bool includeEmbeddedVideos;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DownloadResponse &&
    other.archiveSize == archiveSize &&
    other.includeEmbeddedVideos == includeEmbeddedVideos;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (archiveSize.hashCode) +
    (includeEmbeddedVideos.hashCode);

  @override
  String toString() => 'DownloadResponse[archiveSize=$archiveSize, includeEmbeddedVideos=$includeEmbeddedVideos]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'archiveSize'] = this.archiveSize;
      json[r'includeEmbeddedVideos'] = this.includeEmbeddedVideos;
    return json;
  }

  /// Returns a new [DownloadResponse] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DownloadResponse? fromJson(dynamic value) {
    upgradeDto(value, "DownloadResponse");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DownloadResponse(
        archiveSize: mapValueOfType<int>(json, r'archiveSize')!,
        includeEmbeddedVideos: mapValueOfType<bool>(json, r'includeEmbeddedVideos')!,
      );
    }
    return null;
  }

  static List<DownloadResponse> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DownloadResponse>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DownloadResponse.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DownloadResponse> mapFromJson(dynamic json) {
    final map = <String, DownloadResponse>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DownloadResponse.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DownloadResponse-objects as value to a dart map
  static Map<String, List<DownloadResponse>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DownloadResponse>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DownloadResponse.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'archiveSize',
    'includeEmbeddedVideos',
  };
}


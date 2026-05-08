//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SnapshotSummaryDto {
  /// Returns a new [SnapshotSummaryDto] instance.
  SnapshotSummaryDto({
    required this.dataAdded,
    required this.filesChanged,
    required this.filesNew,
    required this.filesUnmodified,
    required this.totalBytes,
    required this.totalFiles,
  });

  num dataAdded;

  num filesChanged;

  num filesNew;

  num filesUnmodified;

  num totalBytes;

  num totalFiles;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SnapshotSummaryDto &&
    other.dataAdded == dataAdded &&
    other.filesChanged == filesChanged &&
    other.filesNew == filesNew &&
    other.filesUnmodified == filesUnmodified &&
    other.totalBytes == totalBytes &&
    other.totalFiles == totalFiles;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (dataAdded.hashCode) +
    (filesChanged.hashCode) +
    (filesNew.hashCode) +
    (filesUnmodified.hashCode) +
    (totalBytes.hashCode) +
    (totalFiles.hashCode);

  @override
  String toString() => 'SnapshotSummaryDto[dataAdded=$dataAdded, filesChanged=$filesChanged, filesNew=$filesNew, filesUnmodified=$filesUnmodified, totalBytes=$totalBytes, totalFiles=$totalFiles]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'dataAdded'] = this.dataAdded;
      json[r'filesChanged'] = this.filesChanged;
      json[r'filesNew'] = this.filesNew;
      json[r'filesUnmodified'] = this.filesUnmodified;
      json[r'totalBytes'] = this.totalBytes;
      json[r'totalFiles'] = this.totalFiles;
    return json;
  }

  /// Returns a new [SnapshotSummaryDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SnapshotSummaryDto? fromJson(dynamic value) {
    upgradeDto(value, "SnapshotSummaryDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SnapshotSummaryDto(
        dataAdded: num.parse('${json[r'dataAdded']}'),
        filesChanged: num.parse('${json[r'filesChanged']}'),
        filesNew: num.parse('${json[r'filesNew']}'),
        filesUnmodified: num.parse('${json[r'filesUnmodified']}'),
        totalBytes: num.parse('${json[r'totalBytes']}'),
        totalFiles: num.parse('${json[r'totalFiles']}'),
      );
    }
    return null;
  }

  static List<SnapshotSummaryDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SnapshotSummaryDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SnapshotSummaryDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SnapshotSummaryDto> mapFromJson(dynamic json) {
    final map = <String, SnapshotSummaryDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SnapshotSummaryDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SnapshotSummaryDto-objects as value to a dart map
  static Map<String, List<SnapshotSummaryDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SnapshotSummaryDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SnapshotSummaryDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'dataAdded',
    'filesChanged',
    'filesNew',
    'filesUnmodified',
    'totalBytes',
    'totalFiles',
  };
}


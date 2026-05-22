//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DownloadArchiveDto {
  /// Returns a new [DownloadArchiveDto] instance.
  DownloadArchiveDto({
    this.assetIds = const [],
    this.edited,
  });

  /// Asset IDs
  List<String> assetIds;

  /// Download edited asset if available
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? edited;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DownloadArchiveDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.edited == edited;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (edited == null ? 0 : edited!.hashCode);

  @override
  String toString() => 'DownloadArchiveDto[assetIds=$assetIds, edited=$edited]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
    if (this.edited != null) {
      json[r'edited'] = this.edited;
    } else {
    //  json[r'edited'] = null;
    }
    return json;
  }

  /// Returns a new [DownloadArchiveDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DownloadArchiveDto? fromJson(dynamic value) {
    upgradeDto(value, "DownloadArchiveDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DownloadArchiveDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        edited: mapValueOfType<bool>(json, r'edited'),
      );
    }
    return null;
  }

  static List<DownloadArchiveDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DownloadArchiveDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DownloadArchiveDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DownloadArchiveDto> mapFromJson(dynamic json) {
    final map = <String, DownloadArchiveDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DownloadArchiveDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DownloadArchiveDto-objects as value to a dart map
  static Map<String, List<DownloadArchiveDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DownloadArchiveDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DownloadArchiveDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
  };
}


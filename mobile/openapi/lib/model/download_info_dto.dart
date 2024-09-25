//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DownloadInfoDto {
  /// Returns a new [DownloadInfoDto] instance.
  DownloadInfoDto({
    this.albumId,
    this.archiveSize,
    this.assetIds = const [],
    this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? albumId;

  /// Minimum value: 1
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  int? archiveSize;

  List<String> assetIds;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DownloadInfoDto &&
    other.albumId == albumId &&
    other.archiveSize == archiveSize &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId == null ? 0 : albumId!.hashCode) +
    (archiveSize == null ? 0 : archiveSize!.hashCode) +
    (assetIds.hashCode) +
    (userId == null ? 0 : userId!.hashCode);

  @override
  String toString() => 'DownloadInfoDto[albumId=$albumId, archiveSize=$archiveSize, assetIds=$assetIds, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumId != null) {
      json[r'albumId'] = this.albumId;
    } else {
    //  json[r'albumId'] = null;
    }
    if (this.archiveSize != null) {
      json[r'archiveSize'] = this.archiveSize;
    } else {
    //  json[r'archiveSize'] = null;
    }
      json[r'assetIds'] = this.assetIds;
    if (this.userId != null) {
      json[r'userId'] = this.userId;
    } else {
    //  json[r'userId'] = null;
    }
    return json;
  }

  /// Returns a new [DownloadInfoDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DownloadInfoDto? fromJson(dynamic value) {
    upgradeDto(value, "DownloadInfoDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DownloadInfoDto(
        albumId: mapValueOfType<String>(json, r'albumId'),
        archiveSize: mapValueOfType<int>(json, r'archiveSize'),
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        userId: mapValueOfType<String>(json, r'userId'),
      );
    }
    return null;
  }

  static List<DownloadInfoDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DownloadInfoDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DownloadInfoDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DownloadInfoDto> mapFromJson(dynamic json) {
    final map = <String, DownloadInfoDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DownloadInfoDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DownloadInfoDto-objects as value to a dart map
  static Map<String, List<DownloadInfoDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DownloadInfoDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DownloadInfoDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


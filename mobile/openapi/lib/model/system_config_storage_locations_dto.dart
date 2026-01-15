//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SystemConfigStorageLocationsDto {
  /// Returns a new [SystemConfigStorageLocationsDto] instance.
  SystemConfigStorageLocationsDto({
    required this.backups,
    required this.encodedVideos,
    required this.originals,
    required this.previews,
    required this.profile,
    required this.thumbnails,
  });

  StorageBackend backups;

  StorageBackend encodedVideos;

  StorageBackend originals;

  StorageBackend previews;

  StorageBackend profile;

  StorageBackend thumbnails;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SystemConfigStorageLocationsDto &&
    other.backups == backups &&
    other.encodedVideos == encodedVideos &&
    other.originals == originals &&
    other.previews == previews &&
    other.profile == profile &&
    other.thumbnails == thumbnails;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (backups.hashCode) +
    (encodedVideos.hashCode) +
    (originals.hashCode) +
    (previews.hashCode) +
    (profile.hashCode) +
    (thumbnails.hashCode);

  @override
  String toString() => 'SystemConfigStorageLocationsDto[backups=$backups, encodedVideos=$encodedVideos, originals=$originals, previews=$previews, profile=$profile, thumbnails=$thumbnails]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'backups'] = this.backups;
      json[r'encodedVideos'] = this.encodedVideos;
      json[r'originals'] = this.originals;
      json[r'previews'] = this.previews;
      json[r'profile'] = this.profile;
      json[r'thumbnails'] = this.thumbnails;
    return json;
  }

  /// Returns a new [SystemConfigStorageLocationsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SystemConfigStorageLocationsDto? fromJson(dynamic value) {
    upgradeDto(value, "SystemConfigStorageLocationsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SystemConfigStorageLocationsDto(
        backups: StorageBackend.fromJson(json[r'backups'])!,
        encodedVideos: StorageBackend.fromJson(json[r'encodedVideos'])!,
        originals: StorageBackend.fromJson(json[r'originals'])!,
        previews: StorageBackend.fromJson(json[r'previews'])!,
        profile: StorageBackend.fromJson(json[r'profile'])!,
        thumbnails: StorageBackend.fromJson(json[r'thumbnails'])!,
      );
    }
    return null;
  }

  static List<SystemConfigStorageLocationsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SystemConfigStorageLocationsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SystemConfigStorageLocationsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SystemConfigStorageLocationsDto> mapFromJson(dynamic json) {
    final map = <String, SystemConfigStorageLocationsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SystemConfigStorageLocationsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SystemConfigStorageLocationsDto-objects as value to a dart map
  static Map<String, List<SystemConfigStorageLocationsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SystemConfigStorageLocationsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SystemConfigStorageLocationsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'backups',
    'encodedVideos',
    'originals',
    'previews',
    'profile',
    'thumbnails',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateSyncSettingsDto {
  /// Returns a new [DuplicateSyncSettingsDto] instance.
  DuplicateSyncSettingsDto({
    this.syncAlbums = false,
    this.syncDescription = false,
    this.syncFavorites = false,
    this.syncLocation = false,
    this.syncRating = false,
    this.syncTags = false,
    this.syncVisibility = false,
  });

  /// Synchronize album membership across duplicate group
  bool syncAlbums;

  /// Synchronize description across duplicate group
  bool syncDescription;

  /// Synchronize favorite status across duplicate group
  bool syncFavorites;

  /// Synchronize GPS location across duplicate group
  bool syncLocation;

  /// Synchronize EXIF rating across duplicate group
  bool syncRating;

  /// Synchronize tags across duplicate group
  bool syncTags;

  /// Synchronize visibility (archive/timeline) across duplicate group
  bool syncVisibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateSyncSettingsDto &&
    other.syncAlbums == syncAlbums &&
    other.syncDescription == syncDescription &&
    other.syncFavorites == syncFavorites &&
    other.syncLocation == syncLocation &&
    other.syncRating == syncRating &&
    other.syncTags == syncTags &&
    other.syncVisibility == syncVisibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (syncAlbums.hashCode) +
    (syncDescription.hashCode) +
    (syncFavorites.hashCode) +
    (syncLocation.hashCode) +
    (syncRating.hashCode) +
    (syncTags.hashCode) +
    (syncVisibility.hashCode);

  @override
  String toString() => 'DuplicateSyncSettingsDto[syncAlbums=$syncAlbums, syncDescription=$syncDescription, syncFavorites=$syncFavorites, syncLocation=$syncLocation, syncRating=$syncRating, syncTags=$syncTags, syncVisibility=$syncVisibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'syncAlbums'] = this.syncAlbums;
      json[r'syncDescription'] = this.syncDescription;
      json[r'syncFavorites'] = this.syncFavorites;
      json[r'syncLocation'] = this.syncLocation;
      json[r'syncRating'] = this.syncRating;
      json[r'syncTags'] = this.syncTags;
      json[r'syncVisibility'] = this.syncVisibility;
    return json;
  }

  /// Returns a new [DuplicateSyncSettingsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateSyncSettingsDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateSyncSettingsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateSyncSettingsDto(
        syncAlbums: mapValueOfType<bool>(json, r'syncAlbums') ?? false,
        syncDescription: mapValueOfType<bool>(json, r'syncDescription') ?? false,
        syncFavorites: mapValueOfType<bool>(json, r'syncFavorites') ?? false,
        syncLocation: mapValueOfType<bool>(json, r'syncLocation') ?? false,
        syncRating: mapValueOfType<bool>(json, r'syncRating') ?? false,
        syncTags: mapValueOfType<bool>(json, r'syncTags') ?? false,
        syncVisibility: mapValueOfType<bool>(json, r'syncVisibility') ?? false,
      );
    }
    return null;
  }

  static List<DuplicateSyncSettingsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateSyncSettingsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateSyncSettingsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateSyncSettingsDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateSyncSettingsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateSyncSettingsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateSyncSettingsDto-objects as value to a dart map
  static Map<String, List<DuplicateSyncSettingsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateSyncSettingsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateSyncSettingsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


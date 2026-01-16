//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResolveSettingsDto {
  /// Returns a new [DuplicateResolveSettingsDto] instance.
  DuplicateResolveSettingsDto({
    required this.synchronizeAlbums,
    required this.synchronizeDescription,
    required this.synchronizeFavorites,
    required this.synchronizeLocation,
    required this.synchronizeRating,
    required this.synchronizeTags,
    required this.synchronizeVisibility,
  });

  /// Synchronize album membership across duplicate group
  bool synchronizeAlbums;

  /// Synchronize description across duplicate group
  bool synchronizeDescription;

  /// Synchronize favorite status across duplicate group
  bool synchronizeFavorites;

  /// Synchronize GPS location across duplicate group
  bool synchronizeLocation;

  /// Synchronize EXIF rating across duplicate group
  bool synchronizeRating;

  /// Synchronize tags across duplicate group
  bool synchronizeTags;

  /// Synchronize visibility (archive/timeline) across duplicate group
  bool synchronizeVisibility;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResolveSettingsDto &&
    other.synchronizeAlbums == synchronizeAlbums &&
    other.synchronizeDescription == synchronizeDescription &&
    other.synchronizeFavorites == synchronizeFavorites &&
    other.synchronizeLocation == synchronizeLocation &&
    other.synchronizeRating == synchronizeRating &&
    other.synchronizeTags == synchronizeTags &&
    other.synchronizeVisibility == synchronizeVisibility;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (synchronizeAlbums.hashCode) +
    (synchronizeDescription.hashCode) +
    (synchronizeFavorites.hashCode) +
    (synchronizeLocation.hashCode) +
    (synchronizeRating.hashCode) +
    (synchronizeTags.hashCode) +
    (synchronizeVisibility.hashCode);

  @override
  String toString() => 'DuplicateResolveSettingsDto[synchronizeAlbums=$synchronizeAlbums, synchronizeDescription=$synchronizeDescription, synchronizeFavorites=$synchronizeFavorites, synchronizeLocation=$synchronizeLocation, synchronizeRating=$synchronizeRating, synchronizeTags=$synchronizeTags, synchronizeVisibility=$synchronizeVisibility]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'synchronizeAlbums'] = this.synchronizeAlbums;
      json[r'synchronizeDescription'] = this.synchronizeDescription;
      json[r'synchronizeFavorites'] = this.synchronizeFavorites;
      json[r'synchronizeLocation'] = this.synchronizeLocation;
      json[r'synchronizeRating'] = this.synchronizeRating;
      json[r'synchronizeTags'] = this.synchronizeTags;
      json[r'synchronizeVisibility'] = this.synchronizeVisibility;
    return json;
  }

  /// Returns a new [DuplicateResolveSettingsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResolveSettingsDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateResolveSettingsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResolveSettingsDto(
        synchronizeAlbums: mapValueOfType<bool>(json, r'synchronizeAlbums')!,
        synchronizeDescription: mapValueOfType<bool>(json, r'synchronizeDescription')!,
        synchronizeFavorites: mapValueOfType<bool>(json, r'synchronizeFavorites')!,
        synchronizeLocation: mapValueOfType<bool>(json, r'synchronizeLocation')!,
        synchronizeRating: mapValueOfType<bool>(json, r'synchronizeRating')!,
        synchronizeTags: mapValueOfType<bool>(json, r'synchronizeTags')!,
        synchronizeVisibility: mapValueOfType<bool>(json, r'synchronizeVisibility')!,
      );
    }
    return null;
  }

  static List<DuplicateResolveSettingsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveSettingsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveSettingsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResolveSettingsDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResolveSettingsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResolveSettingsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResolveSettingsDto-objects as value to a dart map
  static Map<String, List<DuplicateResolveSettingsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResolveSettingsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResolveSettingsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'synchronizeAlbums',
    'synchronizeDescription',
    'synchronizeFavorites',
    'synchronizeLocation',
    'synchronizeRating',
    'synchronizeTags',
    'synchronizeVisibility',
  };
}


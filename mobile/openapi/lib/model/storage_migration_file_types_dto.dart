//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class StorageMigrationFileTypesDto {
  /// Returns a new [StorageMigrationFileTypesDto] instance.
  StorageMigrationFileTypesDto({
    this.encodedVideos = true,
    this.fullsize = true,
    this.originals = true,
    this.personThumbnails = true,
    this.previews = true,
    this.profileImages = true,
    this.sidecars = true,
    this.thumbnails = true,
  });

  /// Include encoded video files
  bool encodedVideos;

  /// Include full-size files
  bool fullsize;

  /// Include original files
  bool originals;

  /// Include person thumbnail files
  bool personThumbnails;

  /// Include preview files
  bool previews;

  /// Include profile image files
  bool profileImages;

  /// Include sidecar files
  bool sidecars;

  /// Include thumbnail files
  bool thumbnails;

  @override
  bool operator ==(Object other) => identical(this, other) || other is StorageMigrationFileTypesDto &&
    other.encodedVideos == encodedVideos &&
    other.fullsize == fullsize &&
    other.originals == originals &&
    other.personThumbnails == personThumbnails &&
    other.previews == previews &&
    other.profileImages == profileImages &&
    other.sidecars == sidecars &&
    other.thumbnails == thumbnails;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (encodedVideos.hashCode) +
    (fullsize.hashCode) +
    (originals.hashCode) +
    (personThumbnails.hashCode) +
    (previews.hashCode) +
    (profileImages.hashCode) +
    (sidecars.hashCode) +
    (thumbnails.hashCode);

  @override
  String toString() => 'StorageMigrationFileTypesDto[encodedVideos=$encodedVideos, fullsize=$fullsize, originals=$originals, personThumbnails=$personThumbnails, previews=$previews, profileImages=$profileImages, sidecars=$sidecars, thumbnails=$thumbnails]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'encodedVideos'] = this.encodedVideos;
      json[r'fullsize'] = this.fullsize;
      json[r'originals'] = this.originals;
      json[r'personThumbnails'] = this.personThumbnails;
      json[r'previews'] = this.previews;
      json[r'profileImages'] = this.profileImages;
      json[r'sidecars'] = this.sidecars;
      json[r'thumbnails'] = this.thumbnails;
    return json;
  }

  /// Returns a new [StorageMigrationFileTypesDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static StorageMigrationFileTypesDto? fromJson(dynamic value) {
    upgradeDto(value, "StorageMigrationFileTypesDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return StorageMigrationFileTypesDto(
        encodedVideos: mapValueOfType<bool>(json, r'encodedVideos')!,
        fullsize: mapValueOfType<bool>(json, r'fullsize')!,
        originals: mapValueOfType<bool>(json, r'originals')!,
        personThumbnails: mapValueOfType<bool>(json, r'personThumbnails')!,
        previews: mapValueOfType<bool>(json, r'previews')!,
        profileImages: mapValueOfType<bool>(json, r'profileImages')!,
        sidecars: mapValueOfType<bool>(json, r'sidecars')!,
        thumbnails: mapValueOfType<bool>(json, r'thumbnails')!,
      );
    }
    return null;
  }

  static List<StorageMigrationFileTypesDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <StorageMigrationFileTypesDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = StorageMigrationFileTypesDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, StorageMigrationFileTypesDto> mapFromJson(dynamic json) {
    final map = <String, StorageMigrationFileTypesDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = StorageMigrationFileTypesDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of StorageMigrationFileTypesDto-objects as value to a dart map
  static Map<String, List<StorageMigrationFileTypesDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<StorageMigrationFileTypesDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = StorageMigrationFileTypesDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'encodedVideos',
    'fullsize',
    'originals',
    'personThumbnails',
    'previews',
    'profileImages',
    'sidecars',
    'thumbnails',
  };
}


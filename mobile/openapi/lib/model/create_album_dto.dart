//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class CreateAlbumDto {
  /// Returns a new [CreateAlbumDto] instance.
  CreateAlbumDto({
    required this.albumName,
    this.sharedWithUserIds = const [],
    this.assetIds = const [],
  });

  String albumName;

  List<String> sharedWithUserIds;

  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is CreateAlbumDto &&
     other.albumName == albumName &&
     other.sharedWithUserIds == sharedWithUserIds &&
     other.assetIds == assetIds;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName.hashCode) +
    (sharedWithUserIds.hashCode) +
    (assetIds.hashCode);

  @override
  String toString() => 'CreateAlbumDto[albumName=$albumName, sharedWithUserIds=$sharedWithUserIds, assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'albumName'] = albumName;
      _json[r'sharedWithUserIds'] = sharedWithUserIds;
      _json[r'assetIds'] = assetIds;
    return _json;
  }

  /// Returns a new [CreateAlbumDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static CreateAlbumDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "CreateAlbumDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "CreateAlbumDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return CreateAlbumDto(
        albumName: mapValueOfType<String>(json, r'albumName')!,
        sharedWithUserIds: json[r'sharedWithUserIds'] is List
            ? (json[r'sharedWithUserIds'] as List).cast<String>()
            : const [],
        assetIds: json[r'assetIds'] is List
            ? (json[r'assetIds'] as List).cast<String>()
            : const [],
      );
    }
    return null;
  }

  static List<CreateAlbumDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <CreateAlbumDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = CreateAlbumDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, CreateAlbumDto> mapFromJson(dynamic json) {
    final map = <String, CreateAlbumDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateAlbumDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of CreateAlbumDto-objects as value to a dart map
  static Map<String, List<CreateAlbumDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<CreateAlbumDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = CreateAlbumDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumName',
  };
}


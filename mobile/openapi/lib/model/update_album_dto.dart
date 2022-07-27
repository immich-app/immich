//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class UpdateAlbumDto {
  /// Returns a new [UpdateAlbumDto] instance.
  UpdateAlbumDto({
    this.albumName,
    this.albumThumbnailAssetId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? albumName;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? albumThumbnailAssetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAlbumDto &&
     other.albumName == albumName &&
     other.albumThumbnailAssetId == albumThumbnailAssetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName == null ? 0 : albumName!.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode);

  @override
  String toString() => 'UpdateAlbumDto[albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
    if (albumName != null) {
      _json[r'albumName'] = albumName;
    } else {
      _json[r'albumName'] = null;
    }
    if (albumThumbnailAssetId != null) {
      _json[r'albumThumbnailAssetId'] = albumThumbnailAssetId;
    } else {
      _json[r'albumThumbnailAssetId'] = null;
    }
    return _json;
  }

  /// Returns a new [UpdateAlbumDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAlbumDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "UpdateAlbumDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "UpdateAlbumDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return UpdateAlbumDto(
        albumName: mapValueOfType<String>(json, r'albumName'),
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
      );
    }
    return null;
  }

  static List<UpdateAlbumDto>? listFromJson(dynamic json, {bool growable = false,}) {
    final result = <UpdateAlbumDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = UpdateAlbumDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, UpdateAlbumDto> mapFromJson(dynamic json) {
    final map = <String, UpdateAlbumDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAlbumDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of UpdateAlbumDto-objects as value to a dart map
  static Map<String, List<UpdateAlbumDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<UpdateAlbumDto>>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = UpdateAlbumDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


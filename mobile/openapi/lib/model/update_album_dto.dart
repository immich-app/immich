//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

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
    this.description,
    this.isActivityEnabled,
    this.order,
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

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isActivityEnabled;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetOrder? order;

  @override
  bool operator ==(Object other) => identical(this, other) || other is UpdateAlbumDto &&
    other.albumName == albumName &&
    other.albumThumbnailAssetId == albumThumbnailAssetId &&
    other.description == description &&
    other.isActivityEnabled == isActivityEnabled &&
    other.order == order;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumName == null ? 0 : albumName!.hashCode) +
    (albumThumbnailAssetId == null ? 0 : albumThumbnailAssetId!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (isActivityEnabled == null ? 0 : isActivityEnabled!.hashCode) +
    (order == null ? 0 : order!.hashCode);

  @override
  String toString() => 'UpdateAlbumDto[albumName=$albumName, albumThumbnailAssetId=$albumThumbnailAssetId, description=$description, isActivityEnabled=$isActivityEnabled, order=$order]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.albumName != null) {
      json[r'albumName'] = this.albumName;
    } else {
    //  json[r'albumName'] = null;
    }
    if (this.albumThumbnailAssetId != null) {
      json[r'albumThumbnailAssetId'] = this.albumThumbnailAssetId;
    } else {
    //  json[r'albumThumbnailAssetId'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.isActivityEnabled != null) {
      json[r'isActivityEnabled'] = this.isActivityEnabled;
    } else {
    //  json[r'isActivityEnabled'] = null;
    }
    if (this.order != null) {
      json[r'order'] = this.order;
    } else {
    //  json[r'order'] = null;
    }
    return json;
  }

  /// Returns a new [UpdateAlbumDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static UpdateAlbumDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return UpdateAlbumDto(
        albumName: mapValueOfType<String>(json, r'albumName'),
        albumThumbnailAssetId: mapValueOfType<String>(json, r'albumThumbnailAssetId'),
        description: mapValueOfType<String>(json, r'description'),
        isActivityEnabled: mapValueOfType<bool>(json, r'isActivityEnabled'),
        order: AssetOrder.fromJson(json[r'order']),
      );
    }
    return null;
  }

  static List<UpdateAlbumDto> listFromJson(dynamic json, {bool growable = false,}) {
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
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = UpdateAlbumDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityFavoriteDto {
  /// Returns a new [ActivityFavoriteDto] instance.
  ActivityFavoriteDto({
    required this.albumId,
    this.assetId,
    required this.favorite,
  });

  String albumId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetId;

  bool favorite;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityFavoriteDto &&
     other.albumId == albumId &&
     other.assetId == assetId &&
     other.favorite == favorite;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (assetId == null ? 0 : assetId!.hashCode) +
    (favorite.hashCode);

  @override
  String toString() => 'ActivityFavoriteDto[albumId=$albumId, assetId=$assetId, favorite=$favorite]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
      json[r'favorite'] = this.favorite;
    return json;
  }

  /// Returns a new [ActivityFavoriteDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityFavoriteDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityFavoriteDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId'),
        favorite: mapValueOfType<bool>(json, r'favorite')!,
      );
    }
    return null;
  }

  static List<ActivityFavoriteDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityFavoriteDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityFavoriteDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityFavoriteDto> mapFromJson(dynamic json) {
    final map = <String, ActivityFavoriteDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityFavoriteDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityFavoriteDto-objects as value to a dart map
  static Map<String, List<ActivityFavoriteDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityFavoriteDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityFavoriteDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'favorite',
  };
}


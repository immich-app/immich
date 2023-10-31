//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityLikeDto {
  /// Returns a new [ActivityLikeDto] instance.
  ActivityLikeDto({
    required this.albumId,
    this.assetId,
    required this.value,
  });

  String albumId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetId;

  bool value;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityLikeDto &&
     other.albumId == albumId &&
     other.assetId == assetId &&
     other.value == value;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (assetId == null ? 0 : assetId!.hashCode) +
    (value.hashCode);

  @override
  String toString() => 'ActivityLikeDto[albumId=$albumId, assetId=$assetId, value=$value]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
      json[r'value'] = this.value;
    return json;
  }

  /// Returns a new [ActivityLikeDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityLikeDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityLikeDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId'),
        value: mapValueOfType<bool>(json, r'value')!,
      );
    }
    return null;
  }

  static List<ActivityLikeDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityLikeDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityLikeDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityLikeDto> mapFromJson(dynamic json) {
    final map = <String, ActivityLikeDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityLikeDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityLikeDto-objects as value to a dart map
  static Map<String, List<ActivityLikeDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityLikeDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityLikeDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'value',
  };
}


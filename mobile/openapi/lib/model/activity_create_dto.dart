//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityCreateDto {
  /// Returns a new [ActivityCreateDto] instance.
  ActivityCreateDto({
    required this.albumId,
    this.assetId,
    this.comment,
    required this.type,
  });

  String albumId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? comment;

  ReactionType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityCreateDto &&
    other.albumId == albumId &&
    other.assetId == assetId &&
    other.comment == comment &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (assetId == null ? 0 : assetId!.hashCode) +
    (comment == null ? 0 : comment!.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'ActivityCreateDto[albumId=$albumId, assetId=$assetId, comment=$comment, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
    if (this.comment != null) {
      json[r'comment'] = this.comment;
    } else {
    //  json[r'comment'] = null;
    }
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [ActivityCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "ActivityCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityCreateDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId'),
        comment: mapValueOfType<String>(json, r'comment'),
        type: ReactionType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<ActivityCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityCreateDto> mapFromJson(dynamic json) {
    final map = <String, ActivityCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityCreateDto-objects as value to a dart map
  static Map<String, List<ActivityCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'type',
  };
}


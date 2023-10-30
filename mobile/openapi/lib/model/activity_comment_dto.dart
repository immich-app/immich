//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityCommentDto {
  /// Returns a new [ActivityCommentDto] instance.
  ActivityCommentDto({
    required this.albumId,
    required this.assetId,
    required this.comment,
  });

  String albumId;

  String assetId;

  String comment;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityCommentDto &&
     other.albumId == albumId &&
     other.assetId == assetId &&
     other.comment == comment;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (assetId.hashCode) +
    (comment.hashCode);

  @override
  String toString() => 'ActivityCommentDto[albumId=$albumId, assetId=$assetId, comment=$comment]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'assetId'] = this.assetId;
      json[r'comment'] = this.comment;
    return json;
  }

  /// Returns a new [ActivityCommentDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityCommentDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityCommentDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
        comment: mapValueOfType<String>(json, r'comment')!,
      );
    }
    return null;
  }

  static List<ActivityCommentDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityCommentDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityCommentDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityCommentDto> mapFromJson(dynamic json) {
    final map = <String, ActivityCommentDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityCommentDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityCommentDto-objects as value to a dart map
  static Map<String, List<ActivityCommentDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityCommentDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityCommentDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'assetId',
    'comment',
  };
}


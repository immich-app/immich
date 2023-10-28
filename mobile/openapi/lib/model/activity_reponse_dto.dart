//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class ActivityReponseDto {
  /// Returns a new [ActivityReponseDto] instance.
  ActivityReponseDto({
    required this.comment,
    required this.createdAt,
    required this.id,
    required this.isFavorite,
    required this.user,
  });

  String? comment;

  DateTime? createdAt;

  String? id;

  bool isFavorite;

  UserCommentDto? user;

  @override
  bool operator ==(Object other) => identical(this, other) || other is ActivityReponseDto &&
     other.comment == comment &&
     other.createdAt == createdAt &&
     other.id == id &&
     other.isFavorite == isFavorite &&
     other.user == user;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (comment == null ? 0 : comment!.hashCode) +
    (createdAt == null ? 0 : createdAt!.hashCode) +
    (id == null ? 0 : id!.hashCode) +
    (isFavorite.hashCode) +
    (user == null ? 0 : user!.hashCode);

  @override
  String toString() => 'ActivityReponseDto[comment=$comment, createdAt=$createdAt, id=$id, isFavorite=$isFavorite, user=$user]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.comment != null) {
      json[r'comment'] = this.comment;
    } else {
    //  json[r'comment'] = null;
    }
    if (this.createdAt != null) {
      json[r'createdAt'] = this.createdAt!.toUtc().toIso8601String();
    } else {
    //  json[r'createdAt'] = null;
    }
    if (this.id != null) {
      json[r'id'] = this.id;
    } else {
    //  json[r'id'] = null;
    }
      json[r'isFavorite'] = this.isFavorite;
    if (this.user != null) {
      json[r'user'] = this.user;
    } else {
    //  json[r'user'] = null;
    }
    return json;
  }

  /// Returns a new [ActivityReponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static ActivityReponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return ActivityReponseDto(
        comment: mapValueOfType<String>(json, r'comment'),
        createdAt: mapDateTime(json, r'createdAt', ''),
        id: mapValueOfType<String>(json, r'id'),
        isFavorite: mapValueOfType<bool>(json, r'isFavorite')!,
        user: UserCommentDto.fromJson(json[r'user']),
      );
    }
    return null;
  }

  static List<ActivityReponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <ActivityReponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = ActivityReponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, ActivityReponseDto> mapFromJson(dynamic json) {
    final map = <String, ActivityReponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = ActivityReponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of ActivityReponseDto-objects as value to a dart map
  static Map<String, List<ActivityReponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<ActivityReponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = ActivityReponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'comment',
    'createdAt',
    'id',
    'isFavorite',
    'user',
  };
}


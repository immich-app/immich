//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class NotificationCreateDto {
  /// Returns a new [NotificationCreateDto] instance.
  NotificationCreateDto({
    this.data,
    this.description,
    this.level,
    this.readAt,
    required this.title,
    this.type,
    required this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? data;

  String? description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  NotificationLevel? level;

  DateTime? readAt;

  String title;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  NotificationType? type;

  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NotificationCreateDto &&
    other.data == data &&
    other.description == description &&
    other.level == level &&
    other.readAt == readAt &&
    other.title == title &&
    other.type == type &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data == null ? 0 : data!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (level == null ? 0 : level!.hashCode) +
    (readAt == null ? 0 : readAt!.hashCode) +
    (title.hashCode) +
    (type == null ? 0 : type!.hashCode) +
    (userId.hashCode);

  @override
  String toString() => 'NotificationCreateDto[data=$data, description=$description, level=$level, readAt=$readAt, title=$title, type=$type, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.data != null) {
      json[r'data'] = this.data;
    } else {
    //  json[r'data'] = null;
    }
    if (this.description != null) {
      json[r'description'] = this.description;
    } else {
    //  json[r'description'] = null;
    }
    if (this.level != null) {
      json[r'level'] = this.level;
    } else {
    //  json[r'level'] = null;
    }
    if (this.readAt != null) {
      json[r'readAt'] = this.readAt!.toUtc().toIso8601String();
    } else {
    //  json[r'readAt'] = null;
    }
      json[r'title'] = this.title;
    if (this.type != null) {
      json[r'type'] = this.type;
    } else {
    //  json[r'type'] = null;
    }
      json[r'userId'] = this.userId;
    return json;
  }

  /// Returns a new [NotificationCreateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static NotificationCreateDto? fromJson(dynamic value) {
    upgradeDto(value, "NotificationCreateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return NotificationCreateDto(
        data: mapValueOfType<Object>(json, r'data'),
        description: mapValueOfType<String>(json, r'description'),
        level: NotificationLevel.fromJson(json[r'level']),
        readAt: mapDateTime(json, r'readAt', r''),
        title: mapValueOfType<String>(json, r'title')!,
        type: NotificationType.fromJson(json[r'type']),
        userId: mapValueOfType<String>(json, r'userId')!,
      );
    }
    return null;
  }

  static List<NotificationCreateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationCreateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationCreateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, NotificationCreateDto> mapFromJson(dynamic json) {
    final map = <String, NotificationCreateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = NotificationCreateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of NotificationCreateDto-objects as value to a dart map
  static Map<String, List<NotificationCreateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<NotificationCreateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = NotificationCreateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'title',
    'userId',
  };
}


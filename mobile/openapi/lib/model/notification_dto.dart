//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class NotificationDto {
  /// Returns a new [NotificationDto] instance.
  NotificationDto({
    required this.createdAt,
    this.data,
    this.description,
    required this.id,
    required this.level,
    this.readAt,
    required this.title,
    required this.type,
  });

  DateTime createdAt;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Object? data;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? description;

  String id;

  NotificationLevel level;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  DateTime? readAt;

  String title;

  NotificationType type;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NotificationDto &&
    other.createdAt == createdAt &&
    other.data == data &&
    other.description == description &&
    other.id == id &&
    other.level == level &&
    other.readAt == readAt &&
    other.title == title &&
    other.type == type;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (createdAt.hashCode) +
    (data == null ? 0 : data!.hashCode) +
    (description == null ? 0 : description!.hashCode) +
    (id.hashCode) +
    (level.hashCode) +
    (readAt == null ? 0 : readAt!.hashCode) +
    (title.hashCode) +
    (type.hashCode);

  @override
  String toString() => 'NotificationDto[createdAt=$createdAt, data=$data, description=$description, id=$id, level=$level, readAt=$readAt, title=$title, type=$type]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'createdAt'] = this.createdAt.toUtc().toIso8601String();
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
      json[r'id'] = this.id;
      json[r'level'] = this.level;
    if (this.readAt != null) {
      json[r'readAt'] = this.readAt!.toUtc().toIso8601String();
    } else {
    //  json[r'readAt'] = null;
    }
      json[r'title'] = this.title;
      json[r'type'] = this.type;
    return json;
  }

  /// Returns a new [NotificationDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static NotificationDto? fromJson(dynamic value) {
    upgradeDto(value, "NotificationDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return NotificationDto(
        createdAt: mapDateTime(json, r'createdAt', r'')!,
        data: mapValueOfType<Object>(json, r'data'),
        description: mapValueOfType<String>(json, r'description'),
        id: mapValueOfType<String>(json, r'id')!,
        level: NotificationLevel.fromJson(json[r'level'])!,
        readAt: mapDateTime(json, r'readAt', r''),
        title: mapValueOfType<String>(json, r'title')!,
        type: NotificationType.fromJson(json[r'type'])!,
      );
    }
    return null;
  }

  static List<NotificationDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, NotificationDto> mapFromJson(dynamic json) {
    final map = <String, NotificationDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = NotificationDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of NotificationDto-objects as value to a dart map
  static Map<String, List<NotificationDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<NotificationDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = NotificationDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'createdAt',
    'id',
    'level',
    'title',
    'type',
  };
}


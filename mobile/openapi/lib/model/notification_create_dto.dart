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
    this.data = const Optional.present(const {}),
    this.description = const Optional.absent(),
    this.level = const Optional.absent(),
    this.readAt = const Optional.absent(),
    required this.title,
    this.type = const Optional.absent(),
    required this.userId,
  });

  /// Additional notification data
  Optional<Map<String, Object>?> data;

  /// Notification description
  Optional<String?> description;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<NotificationLevel?> level;

  /// Date when notification was read
  Optional<DateTime?> readAt;

  /// Notification title
  String title;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<NotificationType?> type;

  /// User ID to send notification to
  String userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NotificationCreateDto &&
    _deepEquality.equals(other.data, data) &&
    other.description == description &&
    other.level == level &&
    other.readAt == readAt &&
    other.title == title &&
    other.type == type &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (data.hashCode) +
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
    if (this.data.isPresent) {
      final value = this.data.value;
      json[r'data'] = value;
    }
    if (this.description.isPresent) {
      final value = this.description.value;
      json[r'description'] = value;
    }
    if (this.level.isPresent) {
      final value = this.level.value;
      json[r'level'] = value;
    }
    if (this.readAt.isPresent) {
      final value = this.readAt.value;
      json[r'readAt'] = value == null ? null : (_isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')
        ? value.millisecondsSinceEpoch
        : value.toUtc().toIso8601String());
    }
      json[r'title'] = this.title;
    if (this.type.isPresent) {
      final value = this.type.value;
      json[r'type'] = value;
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
        data: json.containsKey(r'data') ? Optional.present(mapCastOfType<String, Object>(json, r'data')) : const Optional.absent(),
        description: json.containsKey(r'description') ? Optional.present(mapValueOfType<String>(json, r'description')) : const Optional.absent(),
        level: json.containsKey(r'level') ? Optional.present(NotificationLevel.fromJson(json[r'level'])) : const Optional.absent(),
        readAt: json.containsKey(r'readAt') ? Optional.present(mapDateTime(json, r'readAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$/')) : const Optional.absent(),
        title: mapValueOfType<String>(json, r'title')!,
        type: json.containsKey(r'type') ? Optional.present(NotificationType.fromJson(json[r'type'])) : const Optional.absent(),
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


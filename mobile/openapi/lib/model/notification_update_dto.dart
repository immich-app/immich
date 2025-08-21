//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class NotificationUpdateDto {
  /// Returns a new [NotificationUpdateDto] instance.
  NotificationUpdateDto({
    this.readAt,
  });

  DateTime? readAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NotificationUpdateDto &&
    other.readAt == readAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (readAt == null ? 0 : readAt!.hashCode);

  @override
  String toString() => 'NotificationUpdateDto[readAt=$readAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.readAt != null) {
      json[r'readAt'] = this.readAt!.toUtc().toIso8601String();
    } else {
    //  json[r'readAt'] = null;
    }
    return json;
  }

  /// Returns a new [NotificationUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static NotificationUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "NotificationUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return NotificationUpdateDto(
        readAt: mapDateTime(json, r'readAt', r''),
      );
    }
    return null;
  }

  static List<NotificationUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, NotificationUpdateDto> mapFromJson(dynamic json) {
    final map = <String, NotificationUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = NotificationUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of NotificationUpdateDto-objects as value to a dart map
  static Map<String, List<NotificationUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<NotificationUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = NotificationUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


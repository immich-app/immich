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

  /// Date when notification was read
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
      json[r'readAt'] = _isEpochMarker(r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/')
        ? this.readAt!.millisecondsSinceEpoch
        : this.readAt!.toUtc().toIso8601String();
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
        readAt: mapDateTime(json, r'readAt', r'/^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?(?:Z))$/'),
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


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class NotificationUpdateAllDto {
  /// Returns a new [NotificationUpdateAllDto] instance.
  NotificationUpdateAllDto({
    this.ids = const [],
    this.readAt,
  });

  List<String> ids;

  DateTime? readAt;

  @override
  bool operator ==(Object other) => identical(this, other) || other is NotificationUpdateAllDto &&
    _deepEquality.equals(other.ids, ids) &&
    other.readAt == readAt;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode) +
    (readAt == null ? 0 : readAt!.hashCode);

  @override
  String toString() => 'NotificationUpdateAllDto[ids=$ids, readAt=$readAt]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
    if (this.readAt != null) {
      json[r'readAt'] = this.readAt!.toUtc().toIso8601String();
    } else {
    //  json[r'readAt'] = null;
    }
    return json;
  }

  /// Returns a new [NotificationUpdateAllDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static NotificationUpdateAllDto? fromJson(dynamic value) {
    upgradeDto(value, "NotificationUpdateAllDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return NotificationUpdateAllDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        readAt: mapDateTime(json, r'readAt', r''),
      );
    }
    return null;
  }

  static List<NotificationUpdateAllDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <NotificationUpdateAllDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = NotificationUpdateAllDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, NotificationUpdateAllDto> mapFromJson(dynamic json) {
    final map = <String, NotificationUpdateAllDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = NotificationUpdateAllDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of NotificationUpdateAllDto-objects as value to a dart map
  static Map<String, List<NotificationUpdateAllDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<NotificationUpdateAllDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = NotificationUpdateAllDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}


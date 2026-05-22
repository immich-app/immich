//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueDeleteDto {
  /// Returns a new [QueueDeleteDto] instance.
  QueueDeleteDto({
    this.failed,
  });

  /// If true, will also remove failed jobs from the queue.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? failed;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueDeleteDto &&
    other.failed == failed;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (failed == null ? 0 : failed!.hashCode);

  @override
  String toString() => 'QueueDeleteDto[failed=$failed]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.failed != null) {
      json[r'failed'] = this.failed;
    } else {
    //  json[r'failed'] = null;
    }
    return json;
  }

  /// Returns a new [QueueDeleteDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueDeleteDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueDeleteDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueDeleteDto(
        failed: mapValueOfType<bool>(json, r'failed'),
      );
    }
    return null;
  }

  static List<QueueDeleteDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueDeleteDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueDeleteDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueDeleteDto> mapFromJson(dynamic json) {
    final map = <String, QueueDeleteDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueDeleteDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueDeleteDto-objects as value to a dart map
  static Map<String, List<QueueDeleteDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueDeleteDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueDeleteDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


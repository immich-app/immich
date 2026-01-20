//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueUpdateDto {
  /// Returns a new [QueueUpdateDto] instance.
  QueueUpdateDto({
    this.isPaused,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? isPaused;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueUpdateDto &&
    other.isPaused == isPaused;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isPaused == null ? 0 : isPaused!.hashCode);

  @override
  String toString() => 'QueueUpdateDto[isPaused=$isPaused]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.isPaused != null) {
      json[r'isPaused'] = this.isPaused;
    } else {
    //  json[r'isPaused'] = null;
    }
    return json;
  }

  /// Returns a new [QueueUpdateDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueUpdateDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueUpdateDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueUpdateDto(
        isPaused: mapValueOfType<bool>(json, r'isPaused'),
      );
    }
    return null;
  }

  static List<QueueUpdateDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueUpdateDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueUpdateDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueUpdateDto> mapFromJson(dynamic json) {
    final map = <String, QueueUpdateDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueUpdateDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueUpdateDto-objects as value to a dart map
  static Map<String, List<QueueUpdateDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueUpdateDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueUpdateDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueCommandDto {
  /// Returns a new [QueueCommandDto] instance.
  QueueCommandDto({
    required this.command,
    this.force,
  });

  QueueCommand command;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  bool? force;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueCommandDto &&
    other.command == command &&
    other.force == force;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (command.hashCode) +
    (force == null ? 0 : force!.hashCode);

  @override
  String toString() => 'QueueCommandDto[command=$command, force=$force]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'command'] = this.command;
    if (this.force != null) {
      json[r'force'] = this.force;
    } else {
    //  json[r'force'] = null;
    }
    return json;
  }

  /// Returns a new [QueueCommandDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueCommandDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueCommandDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueCommandDto(
        command: QueueCommand.fromJson(json[r'command'])!,
        force: mapValueOfType<bool>(json, r'force'),
      );
    }
    return null;
  }

  static List<QueueCommandDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueCommandDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueCommandDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueCommandDto> mapFromJson(dynamic json) {
    final map = <String, QueueCommandDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueCommandDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueCommandDto-objects as value to a dart map
  static Map<String, List<QueueCommandDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueCommandDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueCommandDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'command',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LogResponseDto {
  /// Returns a new [LogResponseDto] instance.
  LogResponseDto({
    required this.logId,
  });

  String logId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LogResponseDto &&
    other.logId == logId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (logId.hashCode);

  @override
  String toString() => 'LogResponseDto[logId=$logId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'logId'] = this.logId;
    return json;
  }

  /// Returns a new [LogResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LogResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "LogResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LogResponseDto(
        logId: mapValueOfType<String>(json, r'logId')!,
      );
    }
    return null;
  }

  static List<LogResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LogResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LogResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LogResponseDto> mapFromJson(dynamic json) {
    final map = <String, LogResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LogResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LogResponseDto-objects as value to a dart map
  static Map<String, List<LogResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LogResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LogResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'logId',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class QueueStatusLegacyDto {
  /// Returns a new [QueueStatusLegacyDto] instance.
  QueueStatusLegacyDto({
    required this.isActive,
    required this.isPaused,
  });

  bool isActive;

  bool isPaused;

  @override
  bool operator ==(Object other) => identical(this, other) || other is QueueStatusLegacyDto &&
    other.isActive == isActive &&
    other.isPaused == isPaused;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (isActive.hashCode) +
    (isPaused.hashCode);

  @override
  String toString() => 'QueueStatusLegacyDto[isActive=$isActive, isPaused=$isPaused]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'isActive'] = this.isActive;
      json[r'isPaused'] = this.isPaused;
    return json;
  }

  /// Returns a new [QueueStatusLegacyDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static QueueStatusLegacyDto? fromJson(dynamic value) {
    upgradeDto(value, "QueueStatusLegacyDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return QueueStatusLegacyDto(
        isActive: mapValueOfType<bool>(json, r'isActive')!,
        isPaused: mapValueOfType<bool>(json, r'isPaused')!,
      );
    }
    return null;
  }

  static List<QueueStatusLegacyDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <QueueStatusLegacyDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = QueueStatusLegacyDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, QueueStatusLegacyDto> mapFromJson(dynamic json) {
    final map = <String, QueueStatusLegacyDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = QueueStatusLegacyDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of QueueStatusLegacyDto-objects as value to a dart map
  static Map<String, List<QueueStatusLegacyDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<QueueStatusLegacyDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = QueueStatusLegacyDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'isActive',
    'isPaused',
  };
}


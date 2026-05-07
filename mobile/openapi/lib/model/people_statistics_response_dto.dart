//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleStatisticsResponseDto {
  /// Returns a new [PeopleStatisticsResponseDto] instance.
  PeopleStatisticsResponseDto({
    required this.detectedFaceCount,
    required this.hidden,
    required this.total,
  });

  /// Number of detected faces in the accessible people scope
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int detectedFaceCount;

  /// Number of hidden people
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int hidden;

  /// Total number of people
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleStatisticsResponseDto &&
    other.detectedFaceCount == detectedFaceCount &&
    other.hidden == hidden &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (detectedFaceCount.hashCode) +
    (hidden.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'PeopleStatisticsResponseDto[detectedFaceCount=$detectedFaceCount, hidden=$hidden, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'detectedFaceCount'] = this.detectedFaceCount;
      json[r'hidden'] = this.hidden;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [PeopleStatisticsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleStatisticsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PeopleStatisticsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleStatisticsResponseDto(
        detectedFaceCount: mapValueOfType<int>(json, r'detectedFaceCount')!,
        hidden: mapValueOfType<int>(json, r'hidden')!,
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<PeopleStatisticsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleStatisticsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleStatisticsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleStatisticsResponseDto> mapFromJson(dynamic json) {
    final map = <String, PeopleStatisticsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleStatisticsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleStatisticsResponseDto-objects as value to a dart map
  static Map<String, List<PeopleStatisticsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleStatisticsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleStatisticsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'detectedFaceCount',
    'hidden',
    'total',
  };
}


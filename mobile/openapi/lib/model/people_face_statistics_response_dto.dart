//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class PeopleFaceStatisticsResponseDto {
  /// Returns a new [PeopleFaceStatisticsResponseDto] instance.
  PeopleFaceStatisticsResponseDto({
    required this.assignedHiddenFaceCount,
    required this.assignedVisibleFaceCount,
    required this.detectedFaceCount,
    required this.namedVisiblePersonCount,
    required this.unassignedFaceCount,
  });

  /// Number of detected faces assigned to hidden people
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int assignedHiddenFaceCount;

  /// Number of detected faces assigned to visible people
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int assignedVisibleFaceCount;

  /// Number of detected faces in the accessible people scope
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int detectedFaceCount;

  /// Number of named visible people in the accessible people scope
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int namedVisiblePersonCount;

  /// Number of detected faces not assigned to people in this scope
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int unassignedFaceCount;

  @override
  bool operator ==(Object other) => identical(this, other) || other is PeopleFaceStatisticsResponseDto &&
    other.assignedHiddenFaceCount == assignedHiddenFaceCount &&
    other.assignedVisibleFaceCount == assignedVisibleFaceCount &&
    other.detectedFaceCount == detectedFaceCount &&
    other.namedVisiblePersonCount == namedVisiblePersonCount &&
    other.unassignedFaceCount == unassignedFaceCount;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assignedHiddenFaceCount.hashCode) +
    (assignedVisibleFaceCount.hashCode) +
    (detectedFaceCount.hashCode) +
    (namedVisiblePersonCount.hashCode) +
    (unassignedFaceCount.hashCode);

  @override
  String toString() => 'PeopleFaceStatisticsResponseDto[assignedHiddenFaceCount=$assignedHiddenFaceCount, assignedVisibleFaceCount=$assignedVisibleFaceCount, detectedFaceCount=$detectedFaceCount, namedVisiblePersonCount=$namedVisiblePersonCount, unassignedFaceCount=$unassignedFaceCount]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assignedHiddenFaceCount'] = this.assignedHiddenFaceCount;
      json[r'assignedVisibleFaceCount'] = this.assignedVisibleFaceCount;
      json[r'detectedFaceCount'] = this.detectedFaceCount;
      json[r'namedVisiblePersonCount'] = this.namedVisiblePersonCount;
      json[r'unassignedFaceCount'] = this.unassignedFaceCount;
    return json;
  }

  /// Returns a new [PeopleFaceStatisticsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static PeopleFaceStatisticsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "PeopleFaceStatisticsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return PeopleFaceStatisticsResponseDto(
        assignedHiddenFaceCount: mapValueOfType<int>(json, r'assignedHiddenFaceCount')!,
        assignedVisibleFaceCount: mapValueOfType<int>(json, r'assignedVisibleFaceCount')!,
        detectedFaceCount: mapValueOfType<int>(json, r'detectedFaceCount')!,
        namedVisiblePersonCount: mapValueOfType<int>(json, r'namedVisiblePersonCount')!,
        unassignedFaceCount: mapValueOfType<int>(json, r'unassignedFaceCount')!,
      );
    }
    return null;
  }

  static List<PeopleFaceStatisticsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <PeopleFaceStatisticsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = PeopleFaceStatisticsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, PeopleFaceStatisticsResponseDto> mapFromJson(dynamic json) {
    final map = <String, PeopleFaceStatisticsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = PeopleFaceStatisticsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of PeopleFaceStatisticsResponseDto-objects as value to a dart map
  static Map<String, List<PeopleFaceStatisticsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<PeopleFaceStatisticsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = PeopleFaceStatisticsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assignedHiddenFaceCount',
    'assignedVisibleFaceCount',
    'detectedFaceCount',
    'namedVisiblePersonCount',
    'unassignedFaceCount',
  };
}


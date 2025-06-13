//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemoryStatisticsResponseDto {
  /// Returns a new [MemoryStatisticsResponseDto] instance.
  MemoryStatisticsResponseDto({
    required this.total,
  });

  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemoryStatisticsResponseDto &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (total.hashCode);

  @override
  String toString() => 'MemoryStatisticsResponseDto[total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [MemoryStatisticsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemoryStatisticsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MemoryStatisticsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemoryStatisticsResponseDto(
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<MemoryStatisticsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryStatisticsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryStatisticsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemoryStatisticsResponseDto> mapFromJson(dynamic json) {
    final map = <String, MemoryStatisticsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemoryStatisticsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemoryStatisticsResponseDto-objects as value to a dart map
  static Map<String, List<MemoryStatisticsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemoryStatisticsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemoryStatisticsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'total',
  };
}


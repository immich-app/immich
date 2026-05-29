//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemorySearchResponseDto {
  /// Returns a new [MemorySearchResponseDto] instance.
  MemorySearchResponseDto({
    required this.hasNextPage,
    this.items = const [],
    required this.total,
  });

  /// Whether there are more pages
  bool hasNextPage;

  List<MemoryResponseDto> items;

  /// Total number of matching memories
  ///
  /// Minimum value: 0
  /// Maximum value: 9007199254740991
  int total;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemorySearchResponseDto &&
    other.hasNextPage == hasNextPage &&
    _deepEquality.equals(other.items, items) &&
    other.total == total;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hasNextPage.hashCode) +
    (items.hashCode) +
    (total.hashCode);

  @override
  String toString() => 'MemorySearchResponseDto[hasNextPage=$hasNextPage, items=$items, total=$total]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hasNextPage'] = this.hasNextPage;
      json[r'items'] = this.items;
      json[r'total'] = this.total;
    return json;
  }

  /// Returns a new [MemorySearchResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemorySearchResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "MemorySearchResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MemorySearchResponseDto(
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage')!,
        items: MemoryResponseDto.listFromJson(json[r'items']),
        total: mapValueOfType<int>(json, r'total')!,
      );
    }
    return null;
  }

  static List<MemorySearchResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemorySearchResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemorySearchResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemorySearchResponseDto> mapFromJson(dynamic json) {
    final map = <String, MemorySearchResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemorySearchResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemorySearchResponseDto-objects as value to a dart map
  static Map<String, List<MemorySearchResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemorySearchResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemorySearchResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hasNextPage',
    'items',
    'total',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class IntegrityReportResponseDto {
  /// Returns a new [IntegrityReportResponseDto] instance.
  IntegrityReportResponseDto({
    required this.hasNextPage,
    this.items = const [],
  });

  bool hasNextPage;

  List<IntegrityReportDto> items;

  @override
  bool operator ==(Object other) => identical(this, other) || other is IntegrityReportResponseDto &&
    other.hasNextPage == hasNextPage &&
    _deepEquality.equals(other.items, items);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hasNextPage.hashCode) +
    (items.hashCode);

  @override
  String toString() => 'IntegrityReportResponseDto[hasNextPage=$hasNextPage, items=$items]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hasNextPage'] = this.hasNextPage;
      json[r'items'] = this.items;
    return json;
  }

  /// Returns a new [IntegrityReportResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static IntegrityReportResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "IntegrityReportResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return IntegrityReportResponseDto(
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage')!,
        items: IntegrityReportDto.listFromJson(json[r'items']),
      );
    }
    return null;
  }

  static List<IntegrityReportResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <IntegrityReportResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = IntegrityReportResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, IntegrityReportResponseDto> mapFromJson(dynamic json) {
    final map = <String, IntegrityReportResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = IntegrityReportResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of IntegrityReportResponseDto-objects as value to a dart map
  static Map<String, List<IntegrityReportResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<IntegrityReportResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = IntegrityReportResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hasNextPage',
    'items',
  };
}


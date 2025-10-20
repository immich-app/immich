//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResponseDto {
  /// Returns a new [DuplicateResponseDto] instance.
  DuplicateResponseDto({
    required this.hasNextPage,
    this.items = const [],
    required this.totalItems,
    required this.totalPages,
  });

  bool hasNextPage;

  List<DuplicateItem> items;

  num totalItems;

  num totalPages;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResponseDto &&
    other.hasNextPage == hasNextPage &&
    _deepEquality.equals(other.items, items) &&
    other.totalItems == totalItems &&
    other.totalPages == totalPages;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (hasNextPage.hashCode) +
    (items.hashCode) +
    (totalItems.hashCode) +
    (totalPages.hashCode);

  @override
  String toString() => 'DuplicateResponseDto[hasNextPage=$hasNextPage, items=$items, totalItems=$totalItems, totalPages=$totalPages]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'hasNextPage'] = this.hasNextPage;
      json[r'items'] = this.items;
      json[r'totalItems'] = this.totalItems;
      json[r'totalPages'] = this.totalPages;
    return json;
  }

  /// Returns a new [DuplicateResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResponseDto(
        hasNextPage: mapValueOfType<bool>(json, r'hasNextPage')!,
        items: DuplicateItem.listFromJson(json[r'items']),
        totalItems: num.parse('${json[r'totalItems']}'),
        totalPages: num.parse('${json[r'totalPages']}'),
      );
    }
    return null;
  }

  static List<DuplicateResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResponseDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResponseDto-objects as value to a dart map
  static Map<String, List<DuplicateResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'hasNextPage',
    'items',
    'totalItems',
    'totalPages',
  };
}


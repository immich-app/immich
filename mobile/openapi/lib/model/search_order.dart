//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class SearchOrder {
  /// Returns a new [SearchOrder] instance.
  SearchOrder({
    this.direction = const Optional.absent(),
    this.field = const Optional.absent(),
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<AssetOrder?> direction;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  Optional<SearchOrderField?> field;

  @override
  bool operator ==(Object other) => identical(this, other) || other is SearchOrder &&
    other.direction == direction &&
    other.field == field;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (direction == null ? 0 : direction!.hashCode) +
    (field == null ? 0 : field!.hashCode);

  @override
  String toString() => 'SearchOrder[direction=$direction, field=$field]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.direction.isPresent) {
      final value = this.direction.value;
      json[r'direction'] = value;
    }
    if (this.field.isPresent) {
      final value = this.field.value;
      json[r'field'] = value;
    }
    return json;
  }

  /// Returns a new [SearchOrder] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static SearchOrder? fromJson(dynamic value) {
    upgradeDto(value, "SearchOrder");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return SearchOrder(
        direction: json.containsKey(r'direction') ? Optional.present(AssetOrder.fromJson(json[r'direction'])) : const Optional.absent(),
        field: json.containsKey(r'field') ? Optional.present(SearchOrderField.fromJson(json[r'field'])) : const Optional.absent(),
      );
    }
    return null;
  }

  static List<SearchOrder> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <SearchOrder>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = SearchOrder.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, SearchOrder> mapFromJson(dynamic json) {
    final map = <String, SearchOrder>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = SearchOrder.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of SearchOrder-objects as value to a dart map
  static Map<String, List<SearchOrder>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<SearchOrder>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = SearchOrder.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


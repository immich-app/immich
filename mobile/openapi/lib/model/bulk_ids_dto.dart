//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class BulkIdsDto {
  /// Returns a new [BulkIdsDto] instance.
  BulkIdsDto({
    this.ids = const [],
  });

  List<String> ids;

  @override
  bool operator ==(Object other) => identical(this, other) || other is BulkIdsDto &&
    _deepEquality.equals(other.ids, ids);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (ids.hashCode);

  @override
  String toString() => 'BulkIdsDto[ids=$ids]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'ids'] = this.ids;
    return json;
  }

  /// Returns a new [BulkIdsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static BulkIdsDto? fromJson(dynamic value) {
    upgradeDto(value, "BulkIdsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return BulkIdsDto(
        ids: json[r'ids'] is Iterable
            ? (json[r'ids'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<BulkIdsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <BulkIdsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = BulkIdsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, BulkIdsDto> mapFromJson(dynamic json) {
    final map = <String, BulkIdsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = BulkIdsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of BulkIdsDto-objects as value to a dart map
  static Map<String, List<BulkIdsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<BulkIdsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = BulkIdsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'ids',
  };
}


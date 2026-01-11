//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMetadataBulkUpsertDto {
  /// Returns a new [AssetMetadataBulkUpsertDto] instance.
  AssetMetadataBulkUpsertDto({
    this.items = const [],
  });

  List<AssetMetadataBulkUpsertItemDto> items;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMetadataBulkUpsertDto &&
    _deepEquality.equals(other.items, items);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (items.hashCode);

  @override
  String toString() => 'AssetMetadataBulkUpsertDto[items=$items]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'items'] = this.items;
    return json;
  }

  /// Returns a new [AssetMetadataBulkUpsertDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMetadataBulkUpsertDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetMetadataBulkUpsertDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMetadataBulkUpsertDto(
        items: AssetMetadataBulkUpsertItemDto.listFromJson(json[r'items']),
      );
    }
    return null;
  }

  static List<AssetMetadataBulkUpsertDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMetadataBulkUpsertDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMetadataBulkUpsertDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMetadataBulkUpsertDto> mapFromJson(dynamic json) {
    final map = <String, AssetMetadataBulkUpsertDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMetadataBulkUpsertDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMetadataBulkUpsertDto-objects as value to a dart map
  static Map<String, List<AssetMetadataBulkUpsertDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMetadataBulkUpsertDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMetadataBulkUpsertDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'items',
  };
}


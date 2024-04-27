//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetDeltaSyncDto {
  /// Returns a new [AssetDeltaSyncDto] instance.
  AssetDeltaSyncDto({
    required this.updatedAfter,
    this.userIds = const [],
  });

  DateTime updatedAfter;

  List<String> userIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetDeltaSyncDto &&
    other.updatedAfter == updatedAfter &&
    _deepEquality.equals(other.userIds, userIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (updatedAfter.hashCode) +
    (userIds.hashCode);

  @override
  String toString() => 'AssetDeltaSyncDto[updatedAfter=$updatedAfter, userIds=$userIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'updatedAfter'] = this.updatedAfter.toUtc().toIso8601String();
      json[r'userIds'] = this.userIds;
    return json;
  }

  /// Returns a new [AssetDeltaSyncDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetDeltaSyncDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetDeltaSyncDto(
        updatedAfter: mapDateTime(json, r'updatedAfter', r'')!,
        userIds: json[r'userIds'] is Iterable
            ? (json[r'userIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<AssetDeltaSyncDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetDeltaSyncDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetDeltaSyncDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetDeltaSyncDto> mapFromJson(dynamic json) {
    final map = <String, AssetDeltaSyncDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetDeltaSyncDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetDeltaSyncDto-objects as value to a dart map
  static Map<String, List<AssetDeltaSyncDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetDeltaSyncDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetDeltaSyncDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'updatedAfter',
    'userIds',
  };
}


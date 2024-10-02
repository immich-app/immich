//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetFullSyncDto {
  /// Returns a new [AssetFullSyncDto] instance.
  AssetFullSyncDto({
    this.lastId,
    required this.limit,
    required this.updatedUntil,
    this.userId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? lastId;

  /// Minimum value: 1
  int limit;

  DateTime updatedUntil;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? userId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetFullSyncDto &&
    other.lastId == lastId &&
    other.limit == limit &&
    other.updatedUntil == updatedUntil &&
    other.userId == userId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (lastId == null ? 0 : lastId!.hashCode) +
    (limit.hashCode) +
    (updatedUntil.hashCode) +
    (userId == null ? 0 : userId!.hashCode);

  @override
  String toString() => 'AssetFullSyncDto[lastId=$lastId, limit=$limit, updatedUntil=$updatedUntil, userId=$userId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.lastId != null) {
      json[r'lastId'] = this.lastId;
    } else {
    //  json[r'lastId'] = null;
    }
      json[r'limit'] = this.limit;
      json[r'updatedUntil'] = this.updatedUntil.toUtc().toIso8601String();
    if (this.userId != null) {
      json[r'userId'] = this.userId;
    } else {
    //  json[r'userId'] = null;
    }
    return json;
  }

  /// Returns a new [AssetFullSyncDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetFullSyncDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetFullSyncDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetFullSyncDto(
        lastId: mapValueOfType<String>(json, r'lastId'),
        limit: mapValueOfType<int>(json, r'limit')!,
        updatedUntil: mapDateTime(json, r'updatedUntil', r'')!,
        userId: mapValueOfType<String>(json, r'userId'),
      );
    }
    return null;
  }

  static List<AssetFullSyncDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetFullSyncDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetFullSyncDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetFullSyncDto> mapFromJson(dynamic json) {
    final map = <String, AssetFullSyncDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetFullSyncDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetFullSyncDto-objects as value to a dart map
  static Map<String, List<AssetFullSyncDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetFullSyncDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetFullSyncDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'limit',
    'updatedUntil',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateResolveGroupDto {
  /// Returns a new [DuplicateResolveGroupDto] instance.
  DuplicateResolveGroupDto({
    required this.duplicateId,
    this.keepAssetIds = const [],
    this.trashAssetIds = const [],
  });

  String duplicateId;

  /// Asset IDs to keep (will have duplicateId cleared)
  List<String> keepAssetIds;

  /// Asset IDs to trash or delete
  List<String> trashAssetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateResolveGroupDto &&
    other.duplicateId == duplicateId &&
    _deepEquality.equals(other.keepAssetIds, keepAssetIds) &&
    _deepEquality.equals(other.trashAssetIds, trashAssetIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (duplicateId.hashCode) +
    (keepAssetIds.hashCode) +
    (trashAssetIds.hashCode);

  @override
  String toString() => 'DuplicateResolveGroupDto[duplicateId=$duplicateId, keepAssetIds=$keepAssetIds, trashAssetIds=$trashAssetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'duplicateId'] = this.duplicateId;
      json[r'keepAssetIds'] = this.keepAssetIds;
      json[r'trashAssetIds'] = this.trashAssetIds;
    return json;
  }

  /// Returns a new [DuplicateResolveGroupDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateResolveGroupDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateResolveGroupDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateResolveGroupDto(
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
        keepAssetIds: json[r'keepAssetIds'] is Iterable
            ? (json[r'keepAssetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        trashAssetIds: json[r'trashAssetIds'] is Iterable
            ? (json[r'trashAssetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<DuplicateResolveGroupDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateResolveGroupDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateResolveGroupDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateResolveGroupDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateResolveGroupDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateResolveGroupDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateResolveGroupDto-objects as value to a dart map
  static Map<String, List<DuplicateResolveGroupDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateResolveGroupDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateResolveGroupDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicateId',
    'keepAssetIds',
    'trashAssetIds',
  };
}


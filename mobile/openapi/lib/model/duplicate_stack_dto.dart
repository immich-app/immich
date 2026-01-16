//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DuplicateStackDto {
  /// Returns a new [DuplicateStackDto] instance.
  DuplicateStackDto({
    this.assetIds = const [],
    required this.duplicateId,
    this.primaryAssetId,
  });

  /// Asset IDs to stack (minimum 2). All must be members of the duplicate group.
  List<String> assetIds;

  String duplicateId;

  /// Optional primary asset ID. Must be in assetIds if provided. If omitted, first asset becomes primary.
  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? primaryAssetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DuplicateStackDto &&
    _deepEquality.equals(other.assetIds, assetIds) &&
    other.duplicateId == duplicateId &&
    other.primaryAssetId == primaryAssetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetIds.hashCode) +
    (duplicateId.hashCode) +
    (primaryAssetId == null ? 0 : primaryAssetId!.hashCode);

  @override
  String toString() => 'DuplicateStackDto[assetIds=$assetIds, duplicateId=$duplicateId, primaryAssetId=$primaryAssetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetIds'] = this.assetIds;
      json[r'duplicateId'] = this.duplicateId;
    if (this.primaryAssetId != null) {
      json[r'primaryAssetId'] = this.primaryAssetId;
    } else {
    //  json[r'primaryAssetId'] = null;
    }
    return json;
  }

  /// Returns a new [DuplicateStackDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DuplicateStackDto? fromJson(dynamic value) {
    upgradeDto(value, "DuplicateStackDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DuplicateStackDto(
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
        primaryAssetId: mapValueOfType<String>(json, r'primaryAssetId'),
      );
    }
    return null;
  }

  static List<DuplicateStackDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DuplicateStackDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DuplicateStackDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DuplicateStackDto> mapFromJson(dynamic json) {
    final map = <String, DuplicateStackDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DuplicateStackDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DuplicateStackDto-objects as value to a dart map
  static Map<String, List<DuplicateStackDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DuplicateStackDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DuplicateStackDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetIds',
    'duplicateId',
  };
}


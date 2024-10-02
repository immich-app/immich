//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetStackResponseDto {
  /// Returns a new [AssetStackResponseDto] instance.
  AssetStackResponseDto({
    required this.assetCount,
    required this.id,
    required this.primaryAssetId,
  });

  int assetCount;

  String id;

  String primaryAssetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetStackResponseDto &&
    other.assetCount == assetCount &&
    other.id == id &&
    other.primaryAssetId == primaryAssetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetCount.hashCode) +
    (id.hashCode) +
    (primaryAssetId.hashCode);

  @override
  String toString() => 'AssetStackResponseDto[assetCount=$assetCount, id=$id, primaryAssetId=$primaryAssetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetCount'] = this.assetCount;
      json[r'id'] = this.id;
      json[r'primaryAssetId'] = this.primaryAssetId;
    return json;
  }

  /// Returns a new [AssetStackResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetStackResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetStackResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetStackResponseDto(
        assetCount: mapValueOfType<int>(json, r'assetCount')!,
        id: mapValueOfType<String>(json, r'id')!,
        primaryAssetId: mapValueOfType<String>(json, r'primaryAssetId')!,
      );
    }
    return null;
  }

  static List<AssetStackResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetStackResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetStackResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetStackResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetStackResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetStackResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetStackResponseDto-objects as value to a dart map
  static Map<String, List<AssetStackResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetStackResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetStackResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetCount',
    'id',
    'primaryAssetId',
  };
}


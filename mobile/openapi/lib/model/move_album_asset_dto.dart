//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MoveAlbumAssetDto {
  /// Returns a new [MoveAlbumAssetDto] instance.
  MoveAlbumAssetDto({
    required this.assetId,
    this.assetIds = const [],
  });

  /// The asset being moved
  String assetId;

  /// Full ordered asset list for prefix anchoring context
  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MoveAlbumAssetDto &&
    other.assetId == assetId &&
    _deepEquality.equals(other.assetIds, assetIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (assetIds.hashCode);

  @override
  String toString() => 'MoveAlbumAssetDto[assetId=$assetId, assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
      json[r'assetIds'] = this.assetIds;
    return json;
  }

  /// Returns a new [MoveAlbumAssetDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MoveAlbumAssetDto? fromJson(dynamic value) {
    upgradeDto(value, "MoveAlbumAssetDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return MoveAlbumAssetDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<MoveAlbumAssetDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MoveAlbumAssetDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MoveAlbumAssetDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MoveAlbumAssetDto> mapFromJson(dynamic json) {
    final map = <String, MoveAlbumAssetDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MoveAlbumAssetDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MoveAlbumAssetDto-objects as value to a dart map
  static Map<String, List<MoveAlbumAssetDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MoveAlbumAssetDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MoveAlbumAssetDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'assetIds',
  };
}


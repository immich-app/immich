//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumAssetResponseDto {
  /// Returns a new [AlbumAssetResponseDto] instance.
  AlbumAssetResponseDto({
    required this.albumId,
    required this.assetId,
  });

  String albumId;

  String assetId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumAssetResponseDto &&
    other.albumId == albumId &&
    other.assetId == assetId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumId.hashCode) +
    (assetId.hashCode);

  @override
  String toString() => 'AlbumAssetResponseDto[albumId=$albumId, assetId=$assetId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumId'] = this.albumId;
      json[r'assetId'] = this.assetId;
    return json;
  }

  /// Returns a new [AlbumAssetResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumAssetResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumAssetResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumAssetResponseDto(
        albumId: mapValueOfType<String>(json, r'albumId')!,
        assetId: mapValueOfType<String>(json, r'assetId')!,
      );
    }
    return null;
  }

  static List<AlbumAssetResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumAssetResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumAssetResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumAssetResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumAssetResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumAssetResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumAssetResponseDto-objects as value to a dart map
  static Map<String, List<AlbumAssetResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumAssetResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumAssetResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumId',
    'assetId',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumsAddAssetsDto {
  /// Returns a new [AlbumsAddAssetsDto] instance.
  AlbumsAddAssetsDto({
    this.albumIds = const [],
    this.assetIds = const [],
  });

  List<String> albumIds;

  List<String> assetIds;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumsAddAssetsDto &&
    _deepEquality.equals(other.albumIds, albumIds) &&
    _deepEquality.equals(other.assetIds, assetIds);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumIds.hashCode) +
    (assetIds.hashCode);

  @override
  String toString() => 'AlbumsAddAssetsDto[albumIds=$albumIds, assetIds=$assetIds]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumIds'] = this.albumIds;
      json[r'assetIds'] = this.assetIds;
    return json;
  }

  /// Returns a new [AlbumsAddAssetsDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumsAddAssetsDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumsAddAssetsDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumsAddAssetsDto(
        albumIds: json[r'albumIds'] is Iterable
            ? (json[r'albumIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
        assetIds: json[r'assetIds'] is Iterable
            ? (json[r'assetIds'] as Iterable).cast<String>().toList(growable: false)
            : const [],
      );
    }
    return null;
  }

  static List<AlbumsAddAssetsDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumsAddAssetsDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumsAddAssetsDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumsAddAssetsDto> mapFromJson(dynamic json) {
    final map = <String, AlbumsAddAssetsDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumsAddAssetsDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumsAddAssetsDto-objects as value to a dart map
  static Map<String, List<AlbumsAddAssetsDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumsAddAssetsDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumsAddAssetsDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'albumIds',
    'assetIds',
  };
}


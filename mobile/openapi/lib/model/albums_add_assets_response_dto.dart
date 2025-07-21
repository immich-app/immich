//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumsAddAssetsResponseDto {
  /// Returns a new [AlbumsAddAssetsResponseDto] instance.
  AlbumsAddAssetsResponseDto({
    this.results = const [],
  });

  List<BulkIdResponseDto> results;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumsAddAssetsResponseDto &&
    _deepEquality.equals(other.results, results);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (results.hashCode);

  @override
  String toString() => 'AlbumsAddAssetsResponseDto[results=$results]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'results'] = this.results;
    return json;
  }

  /// Returns a new [AlbumsAddAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumsAddAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AlbumsAddAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumsAddAssetsResponseDto(
        results: BulkIdResponseDto.listFromJson(json[r'results']),
      );
    }
    return null;
  }

  static List<AlbumsAddAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumsAddAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumsAddAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumsAddAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumsAddAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumsAddAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumsAddAssetsResponseDto-objects as value to a dart map
  static Map<String, List<AlbumsAddAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumsAddAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumsAddAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'results',
  };
}


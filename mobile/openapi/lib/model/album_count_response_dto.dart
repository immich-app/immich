//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumCountResponseDto {
  /// Returns a new [AlbumCountResponseDto] instance.
  AlbumCountResponseDto({
    required this.notShared,
    required this.owned,
    required this.shared,
  });

  int notShared;

  int owned;

  int shared;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumCountResponseDto &&
    other.notShared == notShared &&
    other.owned == owned &&
    other.shared == shared;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (notShared.hashCode) +
    (owned.hashCode) +
    (shared.hashCode);

  @override
  String toString() => 'AlbumCountResponseDto[notShared=$notShared, owned=$owned, shared=$shared]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'notShared'] = this.notShared;
      json[r'owned'] = this.owned;
      json[r'shared'] = this.shared;
    return json;
  }

  /// Returns a new [AlbumCountResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumCountResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AlbumCountResponseDto(
        notShared: mapValueOfType<int>(json, r'notShared')!,
        owned: mapValueOfType<int>(json, r'owned')!,
        shared: mapValueOfType<int>(json, r'shared')!,
      );
    }
    return null;
  }

  static List<AlbumCountResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AlbumCountResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AlbumCountResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AlbumCountResponseDto> mapFromJson(dynamic json) {
    final map = <String, AlbumCountResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumCountResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AlbumCountResponseDto-objects as value to a dart map
  static Map<String, List<AlbumCountResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AlbumCountResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AlbumCountResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'notShared',
    'owned',
    'shared',
  };
}


//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AlbumCountResponseDto {
  /// Returns a new [AlbumCountResponseDto] instance.
  AlbumCountResponseDto({
    required this.owned,
    required this.shared,
    required this.notShared,
  });

  int owned;

  int shared;

  int notShared;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumCountResponseDto &&
     other.owned == owned &&
     other.shared == shared &&
     other.notShared == notShared;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (owned.hashCode) +
    (shared.hashCode) +
    (notShared.hashCode);

  @override
  String toString() => 'AlbumCountResponseDto[owned=$owned, shared=$shared, notShared=$notShared]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'owned'] = this.owned;
      json[r'shared'] = this.shared;
      json[r'notShared'] = this.notShared;
    return json;
  }

  /// Returns a new [AlbumCountResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AlbumCountResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "AlbumCountResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "AlbumCountResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return AlbumCountResponseDto(
        owned: mapValueOfType<int>(json, r'owned')!,
        shared: mapValueOfType<int>(json, r'shared')!,
        notShared: mapValueOfType<int>(json, r'notShared')!,
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
    'owned',
    'shared',
    'notShared',
  };
}


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
    required this.sharing,
  });

  int owned;

  int shared;

  int sharing;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumCountResponseDto &&
     other.owned == owned &&
     other.shared == shared &&
     other.sharing == sharing;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (owned.hashCode) +
    (shared.hashCode) +
    (sharing.hashCode);

  @override
  String toString() => 'AlbumCountResponseDto[owned=$owned, shared=$shared, sharing=$sharing]';

  Map<String, dynamic> toJson() {
    final _json = <String, dynamic>{};
      _json[r'owned'] = owned;
      _json[r'shared'] = shared;
      _json[r'sharing'] = sharing;
    return _json;
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
        sharing: mapValueOfType<int>(json, r'sharing')!,
      );
    }
    return null;
  }

  static List<AlbumCountResponseDto>? listFromJson(dynamic json, {bool growable = false,}) {
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
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AlbumCountResponseDto.listFromJson(entry.value, growable: growable,);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'owned',
    'shared',
    'sharing',
  };
}


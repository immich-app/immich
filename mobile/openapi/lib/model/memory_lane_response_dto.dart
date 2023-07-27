//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class MemoryLaneResponseDto {
  /// Returns a new [MemoryLaneResponseDto] instance.
  MemoryLaneResponseDto({
    required this.title,
    this.assets = const [],
  });

  String title;

  List<AssetResponseDto> assets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is MemoryLaneResponseDto &&
     other.title == title &&
     other.assets == assets;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (title.hashCode) +
    (assets.hashCode);

  @override
  String toString() => 'MemoryLaneResponseDto[title=$title, assets=$assets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'title'] = this.title;
      json[r'assets'] = this.assets;
    return json;
  }

  /// Returns a new [MemoryLaneResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static MemoryLaneResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      // Ensure that the map contains the required keys.
      // Note 1: the values aren't checked for validity beyond being non-null.
      // Note 2: this code is stripped in release mode!
      assert(() {
        requiredKeys.forEach((key) {
          assert(json.containsKey(key), 'Required key "MemoryLaneResponseDto[$key]" is missing from JSON.');
          assert(json[key] != null, 'Required key "MemoryLaneResponseDto[$key]" has a null value in JSON.');
        });
        return true;
      }());

      return MemoryLaneResponseDto(
        title: mapValueOfType<String>(json, r'title')!,
        assets: AssetResponseDto.listFromJson(json[r'assets']),
      );
    }
    return null;
  }

  static List<MemoryLaneResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <MemoryLaneResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = MemoryLaneResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, MemoryLaneResponseDto> mapFromJson(dynamic json) {
    final map = <String, MemoryLaneResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = MemoryLaneResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of MemoryLaneResponseDto-objects as value to a dart map
  static Map<String, List<MemoryLaneResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<MemoryLaneResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = MemoryLaneResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'title',
    'assets',
  };
}


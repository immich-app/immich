//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class LargeAssetsResponseDto {
  /// Returns a new [LargeAssetsResponseDto] instance.
  LargeAssetsResponseDto({
    this.assets = const [],
  });

  List<AssetResponseDto> assets;

  @override
  bool operator ==(Object other) => identical(this, other) || other is LargeAssetsResponseDto &&
    _deepEquality.equals(other.assets, assets);

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assets.hashCode);

  @override
  String toString() => 'LargeAssetsResponseDto[assets=$assets]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assets'] = this.assets;
    return json;
  }

  /// Returns a new [LargeAssetsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static LargeAssetsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "LargeAssetsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return LargeAssetsResponseDto(
        assets: AssetResponseDto.listFromJson(json[r'assets']),
      );
    }
    return null;
  }

  static List<LargeAssetsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <LargeAssetsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = LargeAssetsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, LargeAssetsResponseDto> mapFromJson(dynamic json) {
    final map = <String, LargeAssetsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = LargeAssetsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of LargeAssetsResponseDto-objects as value to a dart map
  static Map<String, List<LargeAssetsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<LargeAssetsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = LargeAssetsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assets',
  };
}


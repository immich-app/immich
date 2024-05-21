//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaResponseDto {
  /// Returns a new [AssetMediaResponseDto] instance.
  AssetMediaResponseDto({
    this.asset,
    this.backup,
    this.duplicate,
    this.status,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetResponseDto? asset;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetResponseDto? backup;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetResponseDto? duplicate;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaResponseDto &&
    other.asset == asset &&
    other.backup == backup &&
    other.duplicate == duplicate &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset == null ? 0 : asset!.hashCode) +
    (backup == null ? 0 : backup!.hashCode) +
    (duplicate == null ? 0 : duplicate!.hashCode) +
    (status == null ? 0 : status!.hashCode);

  @override
  String toString() => 'AssetMediaResponseDto[asset=$asset, backup=$backup, duplicate=$duplicate, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
    if (this.backup != null) {
      json[r'backup'] = this.backup;
    } else {
    //  json[r'backup'] = null;
    }
    if (this.duplicate != null) {
      json[r'duplicate'] = this.duplicate;
    } else {
    //  json[r'duplicate'] = null;
    }
    if (this.status != null) {
      json[r'status'] = this.status;
    } else {
    //  json[r'status'] = null;
    }
    return json;
  }

  /// Returns a new [AssetMediaResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaResponseDto(
        asset: AssetResponseDto.fromJson(json[r'asset']),
        backup: AssetResponseDto.fromJson(json[r'backup']),
        duplicate: AssetResponseDto.fromJson(json[r'duplicate']),
        status: mapValueOfType<String>(json, r'status'),
      );
    }
    return null;
  }

  static List<AssetMediaResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMediaResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaResponseDto-objects as value to a dart map
  static Map<String, List<AssetMediaResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
  };
}


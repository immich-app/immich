//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetMediaUploadResponseDto {
  /// Returns a new [AssetMediaUploadResponseDto] instance.
  AssetMediaUploadResponseDto({
    this.asset,
    required this.duplicate,
    required this.duplicateId,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetResponseDto? asset;

  bool duplicate;

  String duplicateId;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetMediaUploadResponseDto &&
    other.asset == asset &&
    other.duplicate == duplicate &&
    other.duplicateId == duplicateId;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (asset == null ? 0 : asset!.hashCode) +
    (duplicate.hashCode) +
    (duplicateId.hashCode);

  @override
  String toString() => 'AssetMediaUploadResponseDto[asset=$asset, duplicate=$duplicate, duplicateId=$duplicateId]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.asset != null) {
      json[r'asset'] = this.asset;
    } else {
    //  json[r'asset'] = null;
    }
      json[r'duplicate'] = this.duplicate;
      json[r'duplicateId'] = this.duplicateId;
    return json;
  }

  /// Returns a new [AssetMediaUploadResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetMediaUploadResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetMediaUploadResponseDto(
        asset: AssetResponseDto.fromJson(json[r'asset']),
        duplicate: mapValueOfType<bool>(json, r'duplicate')!,
        duplicateId: mapValueOfType<String>(json, r'duplicateId')!,
      );
    }
    return null;
  }

  static List<AssetMediaUploadResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetMediaUploadResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetMediaUploadResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetMediaUploadResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetMediaUploadResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetMediaUploadResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetMediaUploadResponseDto-objects as value to a dart map
  static Map<String, List<AssetMediaUploadResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetMediaUploadResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetMediaUploadResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'duplicate',
    'duplicateId',
  };
}


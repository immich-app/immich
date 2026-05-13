//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class AssetIdsResponseDto {
  /// Returns a new [AssetIdsResponseDto] instance.
  AssetIdsResponseDto({
    required this.assetId,
    this.error,
    required this.success,
  });

  /// Asset ID
  String assetId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  AssetIdErrorReason? error;

  /// Whether operation succeeded
  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AssetIdsResponseDto &&
    other.assetId == assetId &&
    other.error == error &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'AssetIdsResponseDto[assetId=$assetId, error=$error, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'assetId'] = this.assetId;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
      json[r'success'] = this.success;
    return json;
  }

  /// Returns a new [AssetIdsResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static AssetIdsResponseDto? fromJson(dynamic value) {
    upgradeDto(value, "AssetIdsResponseDto");
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return AssetIdsResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId')!,
        error: AssetIdErrorReason.fromJson(json[r'error']),
        success: mapValueOfType<bool>(json, r'success')!,
      );
    }
    return null;
  }

  static List<AssetIdsResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <AssetIdsResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = AssetIdsResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, AssetIdsResponseDto> mapFromJson(dynamic json) {
    final map = <String, AssetIdsResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = AssetIdsResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of AssetIdsResponseDto-objects as value to a dart map
  static Map<String, List<AssetIdsResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<AssetIdsResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = AssetIdsResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'assetId',
    'success',
  };
}


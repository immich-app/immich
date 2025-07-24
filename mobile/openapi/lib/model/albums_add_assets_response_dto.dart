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
    required this.albumSuccessCount,
    required this.assetSuccessCount,
    this.error,
    required this.success,
  });

  int albumSuccessCount;

  int assetSuccessCount;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  BulkIdErrorReason? error;

  bool success;

  @override
  bool operator ==(Object other) => identical(this, other) || other is AlbumsAddAssetsResponseDto &&
    other.albumSuccessCount == albumSuccessCount &&
    other.assetSuccessCount == assetSuccessCount &&
    other.error == error &&
    other.success == success;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (albumSuccessCount.hashCode) +
    (assetSuccessCount.hashCode) +
    (error == null ? 0 : error!.hashCode) +
    (success.hashCode);

  @override
  String toString() => 'AlbumsAddAssetsResponseDto[albumSuccessCount=$albumSuccessCount, assetSuccessCount=$assetSuccessCount, error=$error, success=$success]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
      json[r'albumSuccessCount'] = this.albumSuccessCount;
      json[r'assetSuccessCount'] = this.assetSuccessCount;
    if (this.error != null) {
      json[r'error'] = this.error;
    } else {
    //  json[r'error'] = null;
    }
      json[r'success'] = this.success;
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
        albumSuccessCount: mapValueOfType<int>(json, r'albumSuccessCount')!,
        assetSuccessCount: mapValueOfType<int>(json, r'assetSuccessCount')!,
        error: BulkIdErrorReason.fromJson(json[r'error']),
        success: mapValueOfType<bool>(json, r'success')!,
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
    'albumSuccessCount',
    'assetSuccessCount',
    'success',
  };
}


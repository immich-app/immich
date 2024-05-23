//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;

class DefaultAssetMediaResponseDto {
  /// Returns a new [DefaultAssetMediaResponseDto] instance.
  DefaultAssetMediaResponseDto({
    this.assetId,
    this.copyId,
    this.duplicateId,
    required this.status,
  });

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? assetId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? copyId;

  ///
  /// Please note: This property should have been non-nullable! Since the specification file
  /// does not include a default value (using the "default:" property), however, the generated
  /// source code must fall back to having a nullable type.
  /// Consider adding a "default:" property in the specification file to hide this note.
  ///
  String? duplicateId;

  AssetMediaStatus status;

  @override
  bool operator ==(Object other) => identical(this, other) || other is DefaultAssetMediaResponseDto &&
    other.assetId == assetId &&
    other.copyId == copyId &&
    other.duplicateId == duplicateId &&
    other.status == status;

  @override
  int get hashCode =>
    // ignore: unnecessary_parenthesis
    (assetId == null ? 0 : assetId!.hashCode) +
    (copyId == null ? 0 : copyId!.hashCode) +
    (duplicateId == null ? 0 : duplicateId!.hashCode) +
    (status.hashCode);

  @override
  String toString() => 'DefaultAssetMediaResponseDto[assetId=$assetId, copyId=$copyId, duplicateId=$duplicateId, status=$status]';

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (this.assetId != null) {
      json[r'assetId'] = this.assetId;
    } else {
    //  json[r'assetId'] = null;
    }
    if (this.copyId != null) {
      json[r'copyId'] = this.copyId;
    } else {
    //  json[r'copyId'] = null;
    }
    if (this.duplicateId != null) {
      json[r'duplicateId'] = this.duplicateId;
    } else {
    //  json[r'duplicateId'] = null;
    }
      json[r'status'] = this.status;
    return json;
  }

  /// Returns a new [DefaultAssetMediaResponseDto] instance and imports its values from
  /// [value] if it's a [Map], null otherwise.
  // ignore: prefer_constructors_over_static_methods
  static DefaultAssetMediaResponseDto? fromJson(dynamic value) {
    if (value is Map) {
      final json = value.cast<String, dynamic>();

      return DefaultAssetMediaResponseDto(
        assetId: mapValueOfType<String>(json, r'assetId'),
        copyId: mapValueOfType<String>(json, r'copyId'),
        duplicateId: mapValueOfType<String>(json, r'duplicateId'),
        status: AssetMediaStatus.fromJson(json[r'status'])!,
      );
    }
    return null;
  }

  static List<DefaultAssetMediaResponseDto> listFromJson(dynamic json, {bool growable = false,}) {
    final result = <DefaultAssetMediaResponseDto>[];
    if (json is List && json.isNotEmpty) {
      for (final row in json) {
        final value = DefaultAssetMediaResponseDto.fromJson(row);
        if (value != null) {
          result.add(value);
        }
      }
    }
    return result.toList(growable: growable);
  }

  static Map<String, DefaultAssetMediaResponseDto> mapFromJson(dynamic json) {
    final map = <String, DefaultAssetMediaResponseDto>{};
    if (json is Map && json.isNotEmpty) {
      json = json.cast<String, dynamic>(); // ignore: parameter_assignments
      for (final entry in json.entries) {
        final value = DefaultAssetMediaResponseDto.fromJson(entry.value);
        if (value != null) {
          map[entry.key] = value;
        }
      }
    }
    return map;
  }

  // maps a json object with a list of DefaultAssetMediaResponseDto-objects as value to a dart map
  static Map<String, List<DefaultAssetMediaResponseDto>> mapListFromJson(dynamic json, {bool growable = false,}) {
    final map = <String, List<DefaultAssetMediaResponseDto>>{};
    if (json is Map && json.isNotEmpty) {
      // ignore: parameter_assignments
      json = json.cast<String, dynamic>();
      for (final entry in json.entries) {
        map[entry.key] = DefaultAssetMediaResponseDto.listFromJson(entry.value, growable: growable,);
      }
    }
    return map;
  }

  /// The list of required keys that must be present in a JSON.
  static const requiredKeys = <String>{
    'status',
  };
}

